let albums = [];
const albumsState = {
    overlay: null,
    isMounted: false
}
const MAX_HISTORY = 100;
const LOG_PREFIX = "[NIW]:"
const STORAGE_KEY = "spicetify-sort-album";
const CHECK_ICON = Spicetify.SVGIcons["check"];
const ALBUM_ICON = Spicetify.SVGIcons["album"];

async function main() {
    console.log(LOG_PREFIX, "Last active tab: ", getData("active-tab"));
    window.clearUsedIndexes = clearUsedIndexes;
    window.getStorage = getStorage;

    if (getUsedIndexes() === null) {
        setData("sorted_albums", []);
        console.log(getData("sorted_albums"));
    }

    while (!Spicetify || !Spicetify.Platform || !Spicetify?.Player || !Spicetify?.CosmosAsync) {
        console.warn(LOG_PREFIX, "Spicetify is not ready yet...!");
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log(LOG_PREFIX, "Spicetify is ready!");

    setupObserver();
    console.log(LOG_PREFIX, "Observer is ready!");

    injectStyles();
    console.log(LOG_PREFIX, "Injected styles");

    setupSongChangeListener();
    console.log(LOG_PREFIX, "Song change listener ready!");

    setupQueueUpdateListener();
    console.log(LOG_PREFIX, "Queue update listener ready!");

    await new Promise(resolve => setTimeout(resolve, 300));
    syncSortedAlbumsStatus();
    console.log(LOG_PREFIX, "Initialization sync started!");

    initExtension();
    console.log(LOG_PREFIX, "Next in Wax running...");
}

function setupObserver() {
    let asideQueueLastState = null;

    const observer = new MutationObserver(() => {
        const isQueueOpen = !!document.querySelector(
            'aside[aria-label="Fila"], aside[aria-label="Queue"]'
        );

        if (isQueueOpen !== asideQueueLastState) {
            asideQueueLastState = isQueueOpen;
            updateAlbumsUI(isQueueOpen);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
}

function updateAlbumsUI(isQueueOpen) {
    const isAlbumsTab = getData("active-tab") === "albums-tab";

    if (isQueueOpen) {
        const tabList = injectAlbumsTab();

        tabList.addEventListener("click", (e) => {
            const btn = e.target.closest("button");
            if (!btn) return;

            activateTab(tabList, btn);
            setData("active-tab", btn.getAttribute("id"));
            updateAlbumsUI(true);
        });
    }

    if (!isQueueOpen || !isAlbumsTab) {
        destroyAlbumsView();
        return;
    }

    if (!albumsState.overlay) {
        albumsState.overlay = injectAlbumsView();
    }

    if (albumsState.overlay) {
        toggleAlbumsView(albumsState.overlay, true);
        renderAlbumsPanel(albumsState.overlay);
    }
}

// ---- Panel Rendering

async function renderAlbumsPanel(overlay) {
    const listEl = overlay.querySelector("#album-queue-list");
    if (!listEl) return;

    listEl.innerHTML = `<p style="color:var(--spice-subtext);font-size:13px;padding:8px 0;">Carregando...</p>`;
    
    const [queueAlbums, sortedAlbums, queueUris] = await Promise.all([
        getQueueAlbums(),
        Promise.resolve(getSortedAlbums()),
        getQueueTrackUris()
    ]);

    const sortedByUri = Object.fromEntries(sortedAlbums.map(a => [a.uri, a]));

    const updatedSorted = sortedAlbums.map(album => {
        if (album.status === "played") return album;
        const stillInQueue = album.trackUris?.some(uri => queueUris.has(uri));
        return { ...album, status: stillInQueue ? "queued" : "played" };
    });

    const playedAlbums = updatedSorted.filter(isAlbumPlayed);

    setData("sorted_albums", updatedSorted);
    const queuedNIW = updatedSorted.filter(a => a.status === "queued");

    listEl.innerHTML = "";

    // --- Section: Queue
    const queueSection = document.createElement("div");
    queueSection.id = "queue-section";
    const queueSectionTitle = document.createElement("h3");
    queueSectionTitle.style = sectionTitleStyle();
    queueSectionTitle.textContent = "Na Fila";
    if (queueAlbums.length === 0 ) {
        queueSectionTitle.textContent = "Nenhum album na fila";
        queueSection.appendChild(queueSectionTitle);
    } else {
        queueSection.appendChild(queueSectionTitle);
        queueAlbums.forEach(album => {
            queueSection.appendChild(buildAlbumCard(album, { badge: album.index !== undefined ? "NIW" : null}));
        });
    }
    listEl.appendChild(queueSection);
    
    // --- Section History
    const histSectionTitleHeader = document.createElement("div");
    const histSection = document.createElement("div");
    const histSectionTitle = document.createElement("h3");
    const histSectionClearButton = document.createElement("button");

    histSectionTitle.textContent = "Historico de albums";
    histSectionClearButton.textContent = "Limpar fila";

    histSectionClearButton.style.cssText = sectionButtonStyle();
    histSectionTitleHeader.style.cssText = histSectionHeaderStyle();
    histSectionClearButton.addEventListener("mouseenter", () => {
        histSectionClearButton.style.transform = "scale(1.04)"
        histSectionClearButton.style.color = "var(--text-base)"
    });
    histSectionClearButton.addEventListener("mouseleave", () => {
        histSectionClearButton.style.transform = "scale(1.0)"
        histSectionClearButton.style.color = "var(--spice-subtext)"
    });
    histSectionClearButton.addEventListener("click", () => {
        pruneHistory(getSortedAlbums(), true);
        renderAlbumsPanel(albumsState.overlay)
    });

    histSectionTitleHeader.id = "history-section-header";
    histSectionClearButton.id = "history-section-clear-button";
    histSection.id = "history-section";

    histSectionTitle.style = sectionTitleStyle();
    histSection.style.marginTop = "24px";

    histSectionTitleHeader.appendChild(histSectionTitle);
    histSectionTitleHeader.appendChild(histSectionClearButton);
    histSection.appendChild(histSectionTitleHeader);

    if (playedAlbums.length === 0) {
        histSectionTitle.textContent = "Nenhum album tocado ainda";
        histSectionClearButton.style.display = "none";
    } else {
        // Most recent first
        [...playedAlbums].reverse().forEach(album => {
            histSection.appendChild(buildAlbumCard(album, {
                badge: "NIW",
                progress: album.playedTracks ?? 0,
                total: album.numTracks,
            }));
        });
    }
    listEl.appendChild(histSection);
}

// Reads the current Spotify queue and group consecutive tracks that share the same album URI, it only returns albums that has more than 1 track in Queue CONSECUTIVELy
async function getQueueAlbums() {
    try {
        const state = await Spicetify.Platform.PlayerAPI.getState();
        const nextTracks = state?.nextItems ?? [];
        const contextUri = state?.context?.uri;

        const albumMap = new Map();
        let prevAlbumUri = null;
        let prevAlbumName = null;
        let prevArtist = null;
        let prevCover = null;
        let currentCount = 0;

        nextTracks.forEach((t, index) => {
            const track    = t.track ?? t;
            const albmUri  = track.metadata?.album_uri ?? track.album?.uri;
            const albmName = track.metadata?.album_title ?? track.album?.name ?? "Unknown Album";
            const artist   = track.metadata?.artist_name ?? track.artists?.[0]?.name ?? "Unknown Artist";
            const cover    = track.metadata?.image_url ?? track.album?.images?.[0]?.url ?? "";

            if (!albmUri || albmUri === contextUri) {
                prevAlbumUri = null;
                currentCount = 0;
                return;
            }

            if (albmUri === prevAlbumUri) {
                currentCount++;
            } else {
                if (prevAlbumUri && currentCount > 1 && !albumMap.has(prevAlbumUri)) {
                    albumMap.set(prevAlbumUri, {
                        uri: prevAlbumUri,
                        name: prevAlbumName,
                        artist: prevArtist,
                        coverUrl: prevCover,
                        trackCount: currentCount
                    });
                }

                currentCount = 1;
            }

            prevAlbumName = albmName;
            prevArtist = artist;
            prevCover = cover;
            prevAlbumUri = albmUri;

            if (index === nextTracks.length - 1) {
                if (currentCount > 1 && !albumMap.has(albmUri)) {
                    albumMap.set(albmUri, {
                        uri: albmUri,
                        name: albmName,
                        artist,
                        coverUrl: cover,
                        trackCount: currentCount
                    });
                }
            }
        });

        return [...albumMap.values()];
    } catch (e) {
        console.error(LOG_PREFIX, "Failed to get queue albums:", e);
        return [];
    }
}

function buildAlbumCard(album, { badge = null, progress = null, total = null} = {}) {
    const card = document.createElement("div");
    card.id = "album-card";
    card.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px;
        border-radius: 6px;
        margin-bottom: 4px;
        transition: background 0.15s;
    `;
    card.addEventListener("mouseenter", () => card.style.background = "var(--spice-highlight)");
    card.addEventListener("mouseleave", () => card.style.background = "transparent");
    
    const img = document.createElement("img");
    img.src = album.coverUrl ?? "";
    img.alt = album.name;
    img.style.cssText = `
        width:48px;
        height:48px;
        border-radius:4px;
        object-fit:cover;
        flex-shrink:0;
        background:var(--spice-card);
    `;

    const info = document.createElement("div");
    info.style.cssText = "flex:1; min-width:0; max-width: 60%;"

    const nameEl = document.createElement("div");
    nameEl.textContent = album.name ?? "Unknown Album";
    nameEl.style.cssText = `
        color:var(--spice-text);
        text-decoration: none;
        font-size:14px;
        font-weight:600;
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
        cursor: pointer;
    `
    nameEl.addEventListener("click", () => {
        Spicetify.Platform.History.push(`/album/${album.uri.split(":")[2]}`);
    })
    nameEl.addEventListener("mouseenter", () => nameEl.style.textDecoration = "underline");
    nameEl.addEventListener("mouseleave", () => nameEl.style.textDecoration = "none");

    const artistEl = document.createElement("div");
    artistEl.textContent = album.artist ?? "Unknown Artist";
    artistEl.style.cssText = `
        color:var(--spice-subtext);
        font-size:13px;
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
        margin-top:2px;
    `;

    const wrapper = document.createElement("div");
    wrapper.id = "album-info-wrapper";
    wrapper.appendChild(nameEl);
    wrapper.appendChild(artistEl);

    if (progress !== null && total) {
        const pct = Math.min(100, Math.round((progress / total) * 100));
        const barWrap = document.createElement("div");
        barWrap.style.cssText = "margin-top:5px;height:3px;background:var(--spice-card);border-radius:2px;overflow:hidden;";
        const barFill = document.createElement("div");
        barFill.style.cssText = `width:${pct}%;height:100%;background:var(--spice-text);border-radius:2px;transition:width 0.3s;`;
        barWrap.appendChild(barFill);

        const trackLabel = document.createElement("div");
        trackLabel.textContent = `${progress} / ${total} faixas`;
        trackLabel.style.cssText = "color:var(--spice-subtext);font-size:11px;margin-top:3px;";

        wrapper.appendChild(barWrap);
        wrapper.appendChild(trackLabel);
    }

    info.appendChild(wrapper);

    card.appendChild(img);
    card.appendChild(info);

    if (badge) {
        const badgeEl = document.createElement("span");
        badgeEl.textContent = badge;
        badgeEl.style.cssText = `
            margin-left: 40px;
            font-size:10px;
            font-weight:700;
            padding:2px 6px;
            border-radius:99px;
            background:var(--spice-button);
            color:var(--spice-text);
            flex-shrink:0;
            letter-spacing:0.5px;
        `;
        card.appendChild(badgeEl);
    }

    return card;
}

async function getQueueTrackUris() {
    try {
        const state = await Spicetify.Platform.PlayerAPI.getState();
        const nextTracks = state?.nextItems ?? state?.queue?.nextItems ?? [];

        return new Set(nextTracks.map(t => t.uri ?? t.track?.uri).filter(Boolean));
    } catch (e) {
        console.error(LOG_PREFIX, "Failed to read queue state: ", e);
        return new Set();
    }
}

// --- Style section

function sectionTitleStyle() {
    const style = document.createElement("style");
    style.innerHTML = `
    color:var(--spice-subtext);
    font-size:11px;
    font-weight:700;
    letter-spacing:1px;
    text-transform:uppercase;
    margin:0 0 8px 0;
    `
    return style;
}

function histSectionHeaderStyle() {
    return `
    display: flex;
    justify-content: space-between;
    align-items: end;
    `;
}

function sectionButtonStyle() {
    return `
    display: block;
    color:var(--spice-subtext);
    font-size:13px;
    font-weight:700;
    letter-spacing:1px;
    text-transform:uppercase;
    cursor: pointer;
    background: none;
    outline: none;
    padding: 0;
    border: none;
    transition: transform color 0.3s ease;
    `;
}

function injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
        @keyframes flipOut {
            from { transform: rotateY(0deg); }
            to   { transform: rotateY(90deg); }
        }
        @keyframes flipIn {
            from { transform: rotateY(90deg); }
            to   { transform: rotateY(0deg); }
        }
    `;

    document.head.appendChild(style);
}

async function initExtension() {
    albums = await getSavedAlbums();
    window.albums = albums;

    const button = createButton();
    button.element.addEventListener("click", async () => onButtonClick(button));
}

function createButton() {
    const button = new Spicetify.Topbar.Button;

    button.label = "Add random album to queue";
    button.icon = "album";

    const btnElement = button.element.querySelector("button");
    btnElement.classList.add("main-globalNav-link-icon");
    btnElement.style.padding = "12px";
    btnElement.style.backgroundColor = "var(--spice-card)";
    btnElement.style.perspective = "200px";
    
    const iconSVG = button.element.querySelector("svg");
    iconSVG.classList.add("Svg-sc-ytk21e-0", "Svg-img-icon-medium")
    iconSVG.style.color = "var(--spice-text)";

    return button;
}

// Searches for saved albums, sort one of them and add them to queue.
async function onButtonClick(btnElement) {
    const iconSVG = btnElement.element.querySelector("svg");
    animateButtonSwap(btnElement, iconSVG);

    const sortedIndex = getRandomIndex(albums.length);
    const album = albums[sortedIndex];

    const tracksUris = await fetchAlbumTracks(album.uri);

    if (!tracksUris) return;

    await addAlbumToQueue(tracksUris);

    // Tiny delay before reading the state so all tracks can be added
    await new Promise(resolve => setTimeout(resolve, 300));

    const state = Spicetify.Platform.PlayerAPI.getState();
    const match = state.nextItems.find(item => item.album.uri === album.uri)

    // Save enriched album entry
    const coverUrl = match?.album.images[1]?.url ?? "Not Found";

    const newEntry = {
        index: album.index,
        uri: album.uri,
        name: album.name,
        artist: album.artist.name,
        numTracks: album.numTracks,
        coverUrl,
        tracksUris, // Needed for queue cross reference
        addedAt: Date.now(),
        status: "queued",
        playedTracks: 0,
    };

    const current = getSortedAlbums();
    setData("sorted_albums", [...current, newEntry]);

    if (albumsState.overlay && albumsState.isMounted) {
        renderAlbumsPanel(albumsState.overlay);
    }

    console.log(LOG_PREFIX, 
        `${albums[sortedIndex].numTracks} songs from ${albums[sortedIndex].name} made by ${albums[sortedIndex].artist.name} were added to queue.`
);

    Spicetify.showNotification(
        `${albums[sortedIndex].numTracks} songs from ${albums[sortedIndex].name} made by ${albums[sortedIndex].artist.name} were added to queue!!! 😄`
    );
}

function animateButtonSwap(btnElement, iconSVG) {
    // First it rotates
    iconSVG.style.animation = "flipOut 0.2s ease-in forwards";

    iconSVG.addEventListener("animationend", () => {
        iconSVG.innerHTML = CHECK_ICON;
        iconSVG.style.animation = "flipIn 0.2s ease-out forwards";
    }, { once: true });

    setTimeout(() => revertButtonSwap(iconSVG), 1500);
}

function revertButtonSwap(iconSVG) {
    iconSVG.style.animation = "flipOut 0.2s ease-in forwards";

    iconSVG.addEventListener("animationend", () => {
        iconSVG.innerHTML = ALBUM_ICON;
        iconSVG.style.animation = "flipIn 0.2s ease-out backwards";

        iconSVG.addEventListener("animationend", () => {
            iconSVG.style.animation = "";
        }, { once: true });
    }, { once: true });
}

async function fetchAlbumTracks(URI) {
    const { queryAlbumTracks } = Spicetify.GraphQL.Definitions;
    
    const { data, errors } = await Spicetify.GraphQL.Request(queryAlbumTracks, {
        uri: URI,
        offset: 0,
        limit: 100,
    });

    if (errors) {
        console.error(LOG_PREFIX, "Error trying to search for album:", errors);
        return;
    }

    if (data.albumUnion.playability.playable === false) {
        console.error(LOG_PREFIX, "Album not available");
        return;
    }

    const trackItems = (data.albumUnion?.tracksV2 ?? data.albumUnion?.tracks ?? { items: []}).items;


    const tracks = trackItems
        .filter(({ track }) => track.playability.playable)
        .map(({ track }) => ({uri: track.uri}));

    if (!tracks.length) {
        console.error(LOG_PREFIX, "No track available");
        return;
    }

    return tracks;
}

async function addAlbumToQueue(tracks) {
    await Spicetify.addToQueue(tracks);
}

async function getSavedAlbums() {
    const res = await Spicetify.CosmosAsync.get(
        "sp://core-collection/unstable/@/list/albums/all?responseFormat=protobufJson"
    );

    if (!Array.isArray(res?.item) || res.item.length === 0) {
        console.warn(LOG_PREFIX, "Library is empty. No albums found.");
        return [];
    }

    const albums = res.item.map((item, index) => ({
        index: item.index,
        uri: item.albumMetadata.link,
        name: item.albumMetadata.name,
        artist: item.albumMetadata.artists[0],
        coverUrl: item.albumMetadata.cover,
        numTracks: item.albumMetadata.numTracks
    }));

    console.log(LOG_PREFIX, `${albums.length} albums found!`);

    return albums;
}

function getRandomIndex(total) {
    const usedIndexes = getUsedIndexes();

    // If all indexes were used we reset them.
    if (usedIndexes.length >= total) {
        console.warn(LOG_PREFIX, "All indexes were used, emptying the stack...");

        // Only clear the "played" ones, keep "queued"
        const queued = getSortedAlbums().filter(a => a.status === "queued");
        setData("sorted_albums", queued);
    }

    const currentIndexes = getUsedIndexes();

    const available = Array.from({ length: total}, (_, i) => i).filter(i => !currentIndexes.includes(i));


    return available[Math.floor(Math.random() * available.length)];
}

function injectAlbumsTab() {
    const tabList = document.querySelector(
        '#Desktop_PanelContainer_Id [role="tablist"]'
    );

    if (!tabList.querySelector("#albums-tab")) {
        console.log(LOG_PREFIX, "Generating albums tab");
        // Get template
        const template = tabList.querySelector("button");
        const tabButton = template.cloneNode(true);

        tabButton.textContent = "Albums";

        tabButton.id = "albums-tab";
        tabButton.setAttribute("data-encore-tab-id", "albums-tab");

        tabButton.setAttribute("aria-controls", "albums-panel");

        tabButton.setAttribute("aria-selected", "false");
        tabButton.setAttribute("tabIndex", "-1");
        tabButton.dataset.tab = "albums";

        tabList.appendChild(tabButton);
    }

    syncTabs(tabList);
    return tabList;
}


function syncTabs(tabList) {
    const savedTab = getData("active-tab");
    if (!savedTab) return;

    const target = tabList.querySelector(`#${savedTab}`);

    if (target) {
        activateTab(tabList, target);
    }
}

function activateTab(tabList, targetBtn) {
  const buttons = tabList.querySelectorAll('[role="tab"]');

  buttons.forEach((btn) => {
    btn.setAttribute('aria-selected', 'false');
    btn.setAttribute('tabindex', '-1');
  });

  targetBtn.setAttribute('aria-selected', 'true');
  targetBtn.setAttribute('tabindex', '0');
}

function injectAlbumsView() {
    console.log(LOG_PREFIX, "Generating Albums View");

    const hostElement = getQueueScrollHost();
    if (!hostElement || document.getElementById('album-queue-overlay')) return;

    // Garantee host is the positioning context
    hostElement.style.position = "relative";

    const overlay = document.createElement("div");
    overlay.id = "album-queue-overlay";
    overlay.style.cssText = `
        position: absolute;
        inset: 0;
        z-index: 10;
        background: var(--spice-sidebar);
        overflow-y: auto;
        display: none;
    `;

    overlay.innerHTML = `<div id="album-queue-list" style="padding: 16px; width: 100%;"></div>`;

    hostElement.appendChild(overlay);
    return overlay;
}

function destroyAlbumsView() {
    const { overlay } = albumsState;

    if (!overlay) return;

    if (overlay._cleanup) {
        overlay._cleanup();
    }

    overlay.remove();
    albumsState.overlay = null;

    console.warn(LOG_PREFIX, "Albums View Destroyed");
}

function toggleAlbumsView(albumsOverlay, isVisible) {
    albumsOverlay.style.display = isVisible ? "flex" : "none";
    albumsState.isMounted = isVisible;
}

function getQueueScrollHost() {
    const queuePanel = document.querySelector(
        'aside[aria-label="Fila"], [aria-label="Queue"]'
    );
    return queuePanel.querySelector("[data-overlayscrollbars-initialize]");

    console.error(LOG_PREFIX, "Queue panel is not open!");
    return null;
}

function setupSongChangeListener() {
    Spicetify.Player.addEventListener("songchange", () => {
        syncSortedAlbumsStatus();
    })
}

function setupQueueUpdateListener() {
    Spicetify.Platform.PlayerAPI.getEvents().addListener("queue_update", () => {
        if (albumsState.overlay && albumsState.isMounted) {
            renderAlbumsPanel(albumsState.overlay)
        }
    })
}

async function syncSortedAlbumsStatus() {
    const currentTrack = Spicetify.Player.data.item;
    if (!currentTrack) {
        console.error(LOG_PREFIX, "Could not sync sorted albums");
        return;
    }
    const currentAlbumUri = currentTrack?.album?.uri;
    const currentTrackUri = currentTrack.uri;
    let sortedAlbums = getSortedAlbums();
    const queueUris = await getQueueTrackUris();

    const alreadyTracked = sortedAlbums.some(a => a.uri === currentAlbumUri);

    if (!alreadyTracked && currentAlbumUri) {
        const state = await Spicetify.Platform.PlayerAPI.getState();
        const nextTrack = state?.nextItems?.[0];
        const nextAlbumUri = nextTrack?.track?.metadata?.album_uri ?? nextTrack?.album?.uri


        if (nextAlbumUri === currentAlbumUri) {
            const tracksUris = await fetchAlbumTracks(currentAlbumUri);
            console.log(LOG_PREFIX, "Organic album detected, saving...");
            const newEntry = {
                index: null,
                uri: currentAlbumUri,
                name: currentTrack.album?.name ?? "Unknown Album",
                artist: currentTrack.artists[0]?.name ?? "Unknown Artist",
                coverUrl: currentTrack.album?.images?.[1]?.url ?? "",
                numTracks: tracksUris.length,
                tracksUris,
                addedAt: Date.now(),
                status: "queued",
                playedTracks: 1
            }

            console.log(LOG_PREFIX, "Sorted Albumns2:", sortedAlbums);
            sortedAlbums = [...sortedAlbums, newEntry];
            setData("sorted_albums", sortedAlbums);
        }
    }

    const updatedSortedAlbums = sortedAlbums.map(album => {
        const trackIndex = album.tracksUris.findIndex(track => track.uri === currentTrackUri);
        const playedTracks = trackIndex >= 0 ? trackIndex + 1 : album.playedTracks;
        const stillInQueue = album.tracksUris?.some(uri => queueUris.has(uri));
        return { ...album, playedTracks, status: stillInQueue ? "queued" : "played"};
    });

    setData("sorted_albums", updatedSortedAlbums);
    pruneHistory(updatedSortedAlbums, false);

    // Refresh
    if (albumsState.overlay && albumsState.isMounted) {
        renderAlbumsPanel(albumsState.overlay)
    }
}

function pruneHistory(sortedAlbums, force) {
    const playedAlbums = sortedAlbums.filter(isAlbumPlayed);

    if (!force && (playedAlbums.length <= MAX_HISTORY || playedAlbums.length <= albums.length)) return;

    const toRemove = force ? sortedAlbums.length : playedAlbums.length - MAX_HISTORY;
    let removed = 0;
    const pruned = sortedAlbums.filter(a => {
        if (force) {
            removed++;
            return false;
        }

        if (a.status === "played" && removed < toRemove) {
            removed++;
            return false;
        }

        return true;
    });

    console.warn(LOG_PREFIX, `Pruned ${toRemove} old history entries.`);
    setData("sorted_albums", pruned);
}

function isAlbumPlayed(album) {
    if (album.status !== "played") return false;
    if (album.numTracks === null) return album.playedTracks >= 2;
    return (album.playedTracks / album.numTracks) >= 0.5;
}

// ------- Storage Helpers

function getSortedAlbums() {
    return getData("sorted_albums") ?? [];
}

function getStorage() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
}

function getUsedIndexes() {
    const albums = getSortedAlbums();

    if (!Array.isArray(albums)) return []

    return albums.map(a => (typeof a === "object" ? a.index : a));
}

function getData(key) {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return data[key];
}

function setData(key, value) {
    let data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (!data || typeof data !== "object" || Array.isArray(data))  data = {};
    data[key] = value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data[key];
}

function clearUsedIndexes() {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    data["sorted_albums"] = [];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));


    if (albumsState.overlay && albumsState.isMounted) {
        renderAlbumsPanel(albumsState.overlay);
    }

    return data;
}

export default main;

// ------- CONSTANTS
const LOG_PREFIX         = "[NIW]:"
const STORAGE_KEY        = "spicetify-sort-album";
const QUEUED_ALBUMS_KEY  = "queued_albums";
const SORTED_ALBUMS_KEY  = "sorted_albums";
const HISTORY_ALBUMS_KEY = "history_albums";
const SAVED_ALBUMS_KEY   = "saved_albums";
const TAB_KEY            = "active-tab";
const MAX_HISTORY        = 100;

// ------- IMPORTANT VARIABLES
let isAlbumTabLoaded = false;
let isAlbumsTabOpen  = false;
let albumState = {};

async function main() {
    injectStyle();
    window.getStorage = getStorage;
    window.setData = setData;
    window.sortSavedAlbum = sortSavedAlbum;
    window.clearStorage = clearStorage;

    while (!Spicetify || !Spicetify.Platform || !Spicetify?.Player || !Spicetify?.CosmosAsync) {
        console.warn(LOG_PREFIX, "Spicetify is not ready yet...!");
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log(LOG_PREFIX, "Spicetify is ready!");

    handleObserver();
    await handleQueueUpdateEvent();

    // SYNC ON INTIALIZATION
    await syncAlbumsQueue(); 
    syncAlbumsHistory();
}

// ------- HANDLERS
let isQueueOpen = false;
function handleObserver() {
    const handleMutation = debounce(() => {
        const panelOpenNow = !!document.querySelector(
            'aside[aria-label="Fila"], aside[aria-label="Queue"]');

        handleTabClickEvents();

        if (isQueueOpen === panelOpenNow) return;
        isQueueOpen = panelOpenNow;

        if (isQueueOpen) {
            injectTab();
            syncTabs();
        } else {
            isAlbumTabLoaded = false;
            isAlbumsTabOpen  = false;
            destroyAlbumsView();
        }
    }, 100);

    const observer = new MutationObserver(handleMutation);
    observer.observe(document.body, { childList: true, subtree: true });
}

async function handleQueueUpdateEvent() {
    Spicetify.Platform.PlayerAPI._queue._events._emitter.on("queue_update", async () => {
        await syncAlbumsQueue(); 
        syncAlbumsHistory();
        updateAlbumsView();
    });
    Spicetify.Player.addEventListener("songchange", async (event) => {
        const track    = event.data.item;
        const trackUri = track.uri;
        const albumUri = track.album.uri;

        if (!albumState[albumUri]) albumState[albumUri] = {playedTracks: new Set(), addedAt: Date.now()};

        albumState[albumUri].playedTracks.add(trackUri);
    })
}

async function handleTabClickEvents() {
    const tabList = getTabList();

    if (tabList) {
        tabList.addEventListener("click", (e) => {
            injectTab();
            const btn = e.target.closest("button");
            if (!btn) return;

            const currentTab = activateTab(tabList, btn);
            setData(TAB_KEY, currentTab.id);
            syncTabs();
        });
    }
}

// ------- STORAGE HELPERS

function getStorage() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
}

function setData(key, value) {
    let data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (!data || typeof data !== "object" || Array.isArray(data))  data = {};
    data[key] = value;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data[key];
}

function getData(key) {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

    let storageData = data[key];

    if (!storageData) {
        if (key === TAB_KEY) storageData = "queue-tab";
        if (key === SORTED_ALBUMS_KEY  ||
            key === HISTORY_ALBUMS_KEY ||
            key === QUEUED_ALBUMS_KEY ||
            key === SAVED_ALBUMS_KEY)
        {
            storageData = [];
        }
    }

    setData(key, storageData);
    return storageData;
}

function getSortedAlbums() {
    return new Set(getData(SORTED_ALBUMS_KEY) ?? []);
}
function clearStorage() {
    Spicetify.LocalStorage.clear();
}

async function getSavedAlbumsUris() {
    const res = await Spicetify.CosmosAsync.get(
        "sp://core-collection/unstable/@/list/albums/all?responseFormat=protobufJson"
    );

    if (!Array.isArray(res?.item) || res.item.length === 0) {
        console.warn(LOG_PREFIX, "Library is empty. No albums found.");
        return [];
    }

    const uris = res.item.map((item, index) => ({
        uri: item.albumMetadata.link,
    }));

    console.log(LOG_PREFIX, `${uris.length} albums found!`);

    return new Set(uris);
}

// ------- ALBUM MANAGEMENT

async function sortSavedAlbum() {
    // First update saved albums
    const savedAlbumsUris = await getSavedAlbumsUris();
    setData(SAVED_ALBUMS_KEY, Array.from(savedAlbumsUris));

    const sortedAlbums = getSortedAlbums();  

    if (sortedAlbums.size >= savedAlbumsUris.size) {
        console.warn(LOG_PREFIX, "All indexes were used, emptying the stack...");
        setData(SORTED_ALBUMS_KEY, []);
        return sortSavedAlbum();
    }  else {
        let availableAlbums = [];

        for (const album of savedAlbumsUris) {
            if (!sortedAlbums.has(album.uri)) {
                availableAlbums.push(album.uri);
            }
        }

        const chosenIndex = Math.floor(Math.random() * availableAlbums.length);
        const chosenAlbum = availableAlbums[chosenIndex];
        sortedAlbums.add(chosenAlbum);
        setData(SORTED_ALBUMS_KEY, Array.from(sortedAlbums))
        
        const albumtracks = await fetchAlbumTracks(chosenAlbum);
        await addAlbumToQueue(albumTracks);
    }
}


async function syncAlbumsQueue() {
    try {
        let queuedAlbums   = [];
        let albumCount     = new Map();
        const playerState  = await Spicetify.Platform.PlayerAPI.getState();
        const nextTracks   = playerState?.nextItems;
        const currentTrack = playerState?.item;

        if (!currentTrack || !nextTracks) return;
        nextTracks.unshift(currentTrack);
        
        for (const track of nextTracks) {
            const albumUri = track.album?.uri;
            albumCount.set(albumUri, (albumCount.get(albumUri) ?? 0) + 1);
        }

        const sortedAlbums = getSortedAlbums();

        await Promise.all(
            [...albumCount.entries()]
            .filter(([uri, count]) => count >= 2 && uri !== "")
            .map(async ([uri, count]) => {
                const albumInfo = await getAlbumInfo(uri);
                if (!albumInfo) return;

                const playedTracks = albumState[uri]?.playedTracks.size ?? 0;
                const addedAt = albumState[uri]?.addedAt ?? Date.now();
                albumInfo.playedTracks = playedTracks;
                albumInfo.addedAt = addedAt;
                albumInfo.isNIW = sortedAlbums.has(uri);

                queuedAlbums.push(albumInfo)
            })
        )
        setData(QUEUED_ALBUMS_KEY, queuedAlbums);
    } catch (error) {
        console.error(LOG_PREFIX, "Failed to sync queue albums:", error);
    }
}

function syncAlbumsHistory() {
    const queuedAlbums   = getData(QUEUED_ALBUMS_KEY);
    const historyAlbums  = getData(HISTORY_ALBUMS_KEY);
    const addedToHistory = new Set(historyAlbums.map(a => a.uri));

    if (!queuedAlbums) return;

    for (album of queuedAlbums) {
        if (!addedToHistory.has(album.uri) && album.playedTracks >= (album.totalTracks / 2)) {
            historyAlbums.push(album);
            addedToHistory.add(album.uri);
        }
    }

    setData(HISTORY_ALBUMS_KEY, historyAlbums);
}

const pendingRequests = new Map();
async function getAlbumInfo(albumUri) {
    if (pendingRequests.has(albumUri)) {
        return pendingRequests.get(albumUri);
    }

    const query = Spicetify.GraphQL.Definitions.getAlbum;

    const promise = Spicetify.GraphQL.Request(query, {
        uri: albumUri,
        offset: 0,
        limit: 50,
    }).then(({ data, errors }) => {
        if (errors) {
            console.error(LOG_PREFIX, "Error trying to search for album:", errors);
            console.error(albumUri);
            return null;
        }
        return {
            uri: data.albumUnion?.uri,
            name: data.albumUnion?.name,
            artist: data.albumUnion?.artists,
            coverUrl: data.albumUnion?.coverArt?.sources?.[1]?.url,
            totalTracks: data.albumUnion?.tracksV2?.totalCount,
            tracksUris: data.albumUnion?.tracksV2?.items,
            userSaved: data.albumUnion?.saved
        };
    }).finally(() => {
        pendingRequests.delete(albumUri);
    });

    pendingRequests.set(albumUri, promise);

    return promise;
}

async function fetchAlbumTracks(uri) {
    const query = Spicetify.GraphQL.Definitions.queryAlbumTracks
    const { data, errors } = await Spicetify.GraphQL.Request(query, {
        uri: uri, offset: 0, limit: 100,
    });

    if (errors) {
        console.error(LOG_PREFIX, "Error trying to search for album:", errors);
        return [];
    }

    if (data.albumUnion.playability.playable === false) {
        console.error(LOG_PREFIX, "Album not available:", uri);
        return [];
    }

    const trackItems = data.albumUnion?.tracksV2.items;

    if (!tracksItems.length) {
        console.error(LOG_PREFIX, "No track available");
        return [];
    }

    const tracks = trackItems
        .filter(({ track }) => track.playability.playable)
        .map(({ track }) => ({uri: track.uri}));

    return tracks;
}

async function addAlbumToQueue(tracks) {
    await Spicetify.addToQueue(tracks);
}

// ------ UI
function injectTab() {
    const tabList = getTabList();

    if (!tabList) {
        console.error(LOG_PREFIX, "Could not find TabList");
        return;
    }

    if (tabList.querySelector("#albums-tab")) { return; }

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

    // Sync on initialization
    syncTabs(tabList);
}

function getTabList() {
    const queuePanel = document.querySelector(
        'aside[aria-label="Fila"], [aria-label="Queue"]'
    );

    const tabList = queuePanel?.querySelector(
        '[role="tablist"]'
    );

    return tabList;
}

function syncTabs() {
    const tabList = getTabList();
    const savedTab = getData(TAB_KEY);

    if (!savedTab || !tabList) return;

    const target = tabList.querySelector(`#${savedTab}`);

    if (target) {
        activateTab(tabList, target);
    }

    if (savedTab === "albums-tab") {
        if (!isAlbumTabLoaded && !isAlbumsTabOpen) {
            injectAlbumsView();
            isAlbumTabLoaded = true;
            isAlbumsTapOpen  = true;
        } 
    } 

    if (savedTab === "albums-tab" && isAlbumTabLoaded) {
        isAlbumsTabOpen = true;
        unhideAlbumsView();
        return;
    }

    if (isAlbumTabLoaded && savedTab !== "albums-tab" && isAlbumsTabOpen) {
        hideAlbumsView();
        isAlbumsTabOpen = false;
        return;
    }
}

function injectAlbumsView() {
    const queuedAlbums = getData(QUEUED_ALBUMS_KEY);
    queuedAlbums.sort((a, b) => b.addedAt - a.addedAt);
    const historyAlbums = getData(HISTORY_ALBUMS_KEY);

    const overlay = document.createElement("div");
    if (!isAlbumsTabOpen) overlay.style.display = "none";
    overlay.id = "album-queue-list";

    const queueSection = makeQueueSection(queuedAlbums);
    const historySection = makeHistorySection(historyAlbums);

    const wrapper = document.createElement("div");
    wrapper.id = "sections-wrapper";

    wrapper.appendChild(queueSection);
    wrapper.appendChild(historySection);
    overlay.appendChild(wrapper);

    const hostElement = getHostElement();
    if (!hostElement) {
        console.error(LOG_PREFIX, "Could not find host element");
        return;
    };

    hostElement.appendChild(overlay);
}

function updateAlbumsView() {
    destroyAlbumsView();
    injectAlbumsView();
}

function makeQueueSection(albums) {
    const element = document.createElement("div");
    element.id = "queue-section";
    const elementHeader = document.createElement("h3");
    element.appendChild(elementHeader);

    if (albums.length === 0) {
        elementHeader.textContent = "Nenhum album na fila";
        return element;
    }

    elementHeader.textContent = "Na fila";
    [...albums].reverse().forEach(album => {
        const card = buildAlbumCard(album);
        element.appendChild(card)
    }) 

    return element;
}

function makeHistorySection(albums) {
    const element = document.createElement("div");
    element.id = "history-section";
    const elementHeader = document.createElement("h3");
    element.appendChild(elementHeader);

    if (albums.length === 0) {
        elementHeader.textContent = "Nenhum album no histórico";
        return element;
    }

    elementHeader.textContent = "Histórico de Albums";
    [...albums].reverse().forEach(album => {
        const card = buildAlbumCard(album);
        element.appendChild(card)
    }) 

    return element;
}

function buildAlbumCard(album) {
    const card = document.createElement("div");
    card.id = "album-card";

    const wrapper = document.createElement("div");
    wrapper.id = "card-info-wrapper";

    const nameEl = document.createElement("a");
    nameEl.textContent = album.name;
    nameEl.id = "album-name";
    nameEl.href = album.uri;

    if (album.isNIW) {
        const badgeEl = document.createElement("span");
        badgeEl.id = "badge";
        badgeEl.textContent = "NIW";
        nameEl.appendChild(badgeEl);
    }

    const pct = Math.min(100, Math.round((album.playedTracks / album.totalTracks) * 100));
    const barWrap = document.createElement("div");
    barWrap.id = "bar-wrap";

    const barFill = document.createElement("div");
    barFill.id = "bar-fill";
    barFill.style.width = `${pct}%`;

    barWrap.appendChild(barFill);

    const trackLabel = document.createElement("p");
    trackLabel.textContent = `${album.playedTracks} / ${album.totalTracks} faixas`;
    trackLabel.id = "bar-label"

    const addedAt = document.createElement("span");
    addedAt.id = "date-label";
    const albumDate = formatDate(album.addedAt);
    addedAt.textContent = `${albumDate}`

    const artistsEl = document.createElement("p");
    const artists = album.artist.items.map(a => a.profile.name)
    artistsEl.id = "album-artists"
    artistsEl.innerHTML = `<span id="artist">${artists.join(', ')}</span>`;

    if (album.userSaved) {
        const heartEl = document.createElement("span");
        heartEl.id = "heart";
        heartEl.textContent = "♥";
        artistsEl.appendChild(heartEl);
    }

    wrapper.appendChild(nameEl);
    wrapper.appendChild(artistsEl);
    wrapper.appendChild(trackLabel);
    wrapper.appendChild(addedAt);
    wrapper.appendChild(barWrap);

    const info = document.createElement("div");
    info.id = "album-info";
    info.appendChild(wrapper);

    const img = document.createElement("img");
    img.src = album.coverUrl;
    img.alt = album.name;

    card.appendChild(img);
    card.appendChild(info);
    return card;
}

function hideAlbumsView() {
    const element = getHostElement().querySelector("#album-queue-list");
    element.style.display = "none"
}

function unhideAlbumsView() {
    const element = getHostElement().querySelector("#album-queue-list");
    element.style.display = "flex"
}

function destroyAlbumsView() {
    const element = getHostElement()?.querySelector("#album-queue-list");
    if (!element) return;

    if (element._cleanup) {
        element._cleanup();
    }
    element.remove();
}

function activateTab(tabList, targetBtn) {
  const buttons = tabList.querySelectorAll('[role="tab"]');

  buttons.forEach((btn) => {
    btn.setAttribute('aria-selected', 'false');
    btn.setAttribute('tabindex', '-1');
  });

  targetBtn.setAttribute('aria-selected', 'true');
  targetBtn.setAttribute('tabindex', '0');

  return targetBtn;
}


// ------ MISC
function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

function getHostElement() {
    const queuePanel = document.querySelector(
        'aside[aria-label="Fila"], [aria-label="Queue"]'
    );
    return queuePanel?.querySelector("[data-overlayscrollbars-initialize]");
}

function formatDate(ms) {
  return new Date(ms).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).replace(",", " 🞄 ");
}

function injectStyle() {
    const style = document.createElement('style');
    style.textContent = `
    
    :root {
        --font-header: 0.875rem;
        --font-medium: 0.825rem;
        --font-small: 0.800rem;
        --font-realsmall: 0.790rem;
        --font-mydih: 0.770rem;
    }

    #album-queue-list {
        position: absolute;
        width: 100%;
        height: 100%;
        padding: 16px;
        background: var(--spice-sidebar);
        display: flex;
        flex-direction: column;
        overflow: hidden;
    }

    #album-queue-list #sections-wrapper {
        display: flex;
        gap: 20px;
        width: 100%;
        min-height: 100%;
        flex-direction: column;
        overflow-y: auto;
        scrollbar-color: rgba(255,255,255,0.0) transparent;
        scrollbar-width: thin;
        transition: scrollbar-color 0.2s ease;
        margin-left: 10px;
        mask-image: linear-gradient(to bottom, black 97%, transparent);
    }

    #album-queue-list #sections-wrapper:hover {
        scrollbar-color: rgba(255,255,255,0.2) transparent;
    }

    #album-queue-list h3 {
        font-size: var(--font-header);
        color: var(--spice-subtext);
        font-weight: 700;
        letter-spacing: 1px;
        text-transform: uppercase;
        padding: 8px;
        border-radius: 10px;
    }

    #album-queue-list #queue-section, #album-queue-list #history-section {
        flex: 0 0 auto;
        background-color: var(--spice-player);
        padding: 16px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 15px;
        border-radius: 10px;
        max-height: 100%;
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,0.0) transparent;
        transition: scrollbar-color 0.2s ease;
        margin-right: 10px;
    }

    #album-queue-list #queue-section:hover, #album-queue-list #history-section:hover {
        scrollbar-color: rgba(255,255,255,0.1) transparent;
    }


    #album-queue-list #album-card {
        background: var(--spice-player);
        width: 100%;
        height: 60px;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px;
        border-radius: 6px;
        margin-bottom: 4px;
        transition: background 0.15s;
    }
    #album-queue-list #album-card:hover {
        transform: scale(1.04);
        background: var(--background-elevated-highlight);
    }


    #album-queue-list #album-card a {
        color: var(--spice-text);
        font-size: var(--font-medium);
        font-weight: 600;
        white-space: nowrap;
        text-overflow: ellipsis;
        cursor: pointer;
        overflow: hidden;
    }

    #album-queue-list #album-card #album-artists {
        color: var(--spice-subtext);
        font-size: var(--font-small);
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        max-width: 60%;
        min-width: 0;
        position: relative;
    }

    #album-queue-list #album-name #badge {
        font-size: var(--font-mydih);
        margin-left: 10px;
        margin-bottom: 2px;
        font-weight: 600;
        padding: 1px 8px;
        border-radius: 99px;
        background: var(--spice-button);
        color: var(--spice-text);
        letter-spacing: 1px;
        text-decoration: none;
    }


    #album-queue-list #album-artists #heart {
        font-size: 25px;
        color: red;
        position: absolute;
        bottom: 0px;
        top: -9px;
    }

    #album-queue-list #album-artists #artist {
        display: inline-block;
        white-space: nowrap;
        padding-right: 0.67rem;
    }

    #album-queue-list #album-artists:hover span {
        animation: scroll-text 8s ease-in-out both infinite;
    }

    @keyframes scroll-text {
        0% {transform: translateX(0);}
        50% {transform: translateX(-30%);}
        100% {transform: translateX(0);}
    }

    #album-queue-list #album-card #album-info { flex: 1 1 auto; min-width: 0; }

    #album-queue-list #album-card #card-info-wrapper {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        position: relative;
    }

    #album-queue-list #album-card #date-label {
        font-size: var(--font-mydih);
        position: absolute;
        right: 0;
    }

    #album-queue-list #album-card #bar-wrap {
        width: 100%;
        height: 3px;
        background: var(--spice-card);
        border-radius: 2px;
        overflow: hidden;
        margin-top: 0.25rem;
    }

    #album-queue-list #album-card #bar-fill {
        width: 0%;
        height: 100%;
        background: var(--spice-button);
        border-radius: 2px;
        transition: width 3s;
    }

    #album-queue-list #album-card #bar-label {
        color: var(--spice-subtext);
        font-size: var(--font-realsmall);
        position: absolute;
        right: 0;
        bottom: 10px;
    }


    #album-queue-list #album-card img {
        width: 56px;
        height: 56px;
        border-radius: 4px;
        object-fit: cover;
        flex-shrink: 0;
    }
    `;
    document.body.appendChild(style);
}

export default main;

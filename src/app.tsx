let albums = [];
const LOG_PREFIX = "[NIW]:"
const STORAGE_KEY = "spicetify-queue-used-index";
const CHECK_ICON = Spicetify.SVGIcons["check"];
const ALBUM_ICON = Spicetify.SVGIcons["album"];

async function main() {
    window.clearUsedIndexes = clearUsedIndexes;
    window.getUsedIndexes = getUsedIndexes;

    while (!Spicetify?.Player || !Spicetify?.CosmosAsync) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log(LOG_PREFIX, "Spicetify is ready!");

    injectStyles();
    console.log(LOG_PREFIX, "Injected styles");

    initExtension();
    console.log(LOG_PREFIX, "Next in Wax running...");

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

    await addAlbumToQueue(albums[sortedIndex].uri);

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

async function addAlbumToQueue(URI) {
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

    console.log(LOG_PREFIX, tracks);

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
        numTracks: item.albumMetadata.numTracks
    }));

    console.log(LOG_PREFIX, `${albums.length} albums found!`);

    return albums;
}

function getRandomIndex(total) {
    let usedIndexes = getUsedIndexes();

    // If all indexes were used we reset them.
    if (usedIndexes.length >= total) {
        console.warn(LOG_PREFIX, "All indexes were used, emptying the stack...");
        usedIndexes = [];
    }

    const availableIndexes = Array.from({ length: total}, (_, i) => i).filter(i => !usedIndexes.includes(i));
    const chosen = availableIndexes[Math.floor(Math.random() * availableIndexes.length)];

    saveUsedIndexes([...usedIndexes, chosen]);

    return chosen;
}

function getUsedIndexes() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
}

function saveUsedIndexes(usedIndexes) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usedIndexes));
}

function clearUsedIndexes() {
  localStorage.removeItem(STORAGE_KEY);
}

export default main;

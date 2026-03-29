const LOG_PREFIX = "[NIW]:"
const CHECK_ICON = Spicetify.SVGIcons["check"];
const ALBUM_ICON = Spicetify.SVGIcons["album"];

async function main() {
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

function initExtension() {
    const button = createButton();
    button.element.addEventListener("click", () => onButtonClick(button));
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
function onButtonClick(btnElement) {
    const iconSVG = btnElement.element.querySelector("svg");

    animateButtonSwap(btnElement, iconSVG);

    // TODO: change album to album's name.
    Spicetify.showNotification("Album added to queue!!! 😄");
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

export default main;

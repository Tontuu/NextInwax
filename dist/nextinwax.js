(async()=>{for(;!Spicetify.React||!Spicetify.ReactDOM;)await new Promise(e=>setTimeout(e,10));var d,r,c,i,l,n,o,u,s,m,t,p,e;function a(){return JSON.parse(localStorage.getItem(r)||"{}")}function b(e,t){let a=JSON.parse(localStorage.getItem(r)||"{}");return(a=a&&"object"==typeof a&&!Array.isArray(a)?a:{})[e]=t,localStorage.setItem(r,JSON.stringify(a)),a[e]}function f(e){let t=JSON.parse(localStorage.getItem(r)||"{}")[e];return b(e,t=t||(e===o&&(t="queue-tab"),e!==i&&e!==l&&e!==c&&e!==n)?t:[]),t}function h(){var e;return new Set(null!=(e=f(i))?e:[])}function y(){Spicetify.LocalStorage.clear()}async function v(){e=await Spicetify.CosmosAsync.get("sp://core-collection/unstable/@/list/albums/all?responseFormat=protobufJson");var e=await(Array.isArray(null==e?void 0:e.item)&&0!==e.item.length?(e=e.item.map((e,t)=>({uri:e.albumMetadata.link})),console.log(d,e.length+" albums found!"),new Set(e)):(console.warn(d,"Library is empty. No albums found."),[])),t=(b(n,Array.from(e)),h());if(t.size>=e.size)return console.warn(d,"All indexes were used, emptying the stack..."),b(i,[]),v();var a,r=[];for(a of e)t.has(a.uri)||r.push(a.uri);var e=r[Math.floor(Math.random()*r.length)];t.add(e),b(i,Array.from(t)),await(async e=>{var t=Spicetify.GraphQL.Definitions.queryAlbumTracks,{data:t,errors:a}=await Spicetify.GraphQL.Request(t,{uri:e,offset:0,limit:100});return a?(console.error(d,"Error trying to search for album:",a),[]):!1===t.albumUnion.playability.playable?(console.error(d,"Album not available:",e),[]):(e=null==(a=t.albumUnion)?void 0:a.tracksV2.items,tracksItems.length?t=e.filter(({track:e})=>e.playability.playable).map(({track:e})=>({uri:e.uri})):(console.error(d,"No track available"),[]))})(e);e=albumTracks,await Spicetify.addToQueue(e)}async function g(){var e,t;try{let l=[];var a=new Map,r=await Spicetify.Platform.PlayerAPI.getState(),n=null==r?void 0:r.nextItems,o=null==r?void 0:r.item;if(o&&n){n.unshift(o);for(var u of n){var s=null==(e=u.album)?void 0:e.uri;a.set(s,(null!=(t=a.get(s))?t:0)+1)}let i=h();await Promise.all([...a.entries()].filter(([e,t])=>2<=t&&""!==e).map(async([e])=>{var t,a,r=await(async a=>{var e;return p.has(a)?p.get(a):(e=Spicetify.GraphQL.Definitions.getAlbum,e=Spicetify.GraphQL.Request(e,{uri:a,offset:0,limit:50}).then(({data:e,errors:t})=>t?(console.error(d,"Error trying to search for album:",t),console.error(a),null):{uri:null==(t=e.albumUnion)?void 0:t.uri,name:null==(t=e.albumUnion)?void 0:t.name,artist:null==(t=e.albumUnion)?void 0:t.artists,coverUrl:null==(t=null==(t=null==(t=null==(t=e.albumUnion)?void 0:t.coverArt)?void 0:t.sources)?void 0:t[1])?void 0:t.url,totalTracks:null==(t=null==(t=e.albumUnion)?void 0:t.tracksV2)?void 0:t.totalCount,tracksUris:null==(t=null==(t=e.albumUnion)?void 0:t.tracksV2)?void 0:t.items,userSaved:null==(t=e.albumUnion)?void 0:t.saved}).finally(()=>{p.delete(a)}),p.set(a,e),e)})(e);r&&(t=null!=(t=null==(t=m[e])?void 0:t.playedTracks.size)?t:0,a=null!=(a=null==(a=m[e])?void 0:a.addedAt)?a:Date.now(),r.playedTracks=t,r.addedAt=a,r.isNIW=i.has(e),l.push(r))})),b(c,l)}}catch(e){console.error(d,"Failed to sync queue albums:",e)}}function w(){var e=f(c),t=f(l),a=new Set(t.map(e=>e.uri));if(e){for(album of e)!a.has(album.uri)&&album.playedTracks>=album.totalTracks/2&&(t.push(album),a.add(album.uri));b(l,t)}}function x(){var e,t=S();t?t.querySelector("#albums-tab")||((e=t.querySelector("button").cloneNode(!0)).textContent="Albums",e.id="albums-tab",e.setAttribute("data-encore-tab-id","albums-tab"),e.setAttribute("aria-controls","albums-panel"),e.setAttribute("aria-selected","false"),e.setAttribute("tabIndex","-1"),e.dataset.tab="albums",t.appendChild(e),q()):console.error(d,"Could not find TabList")}function S(){var e=document.querySelector('aside[aria-label="Fila"], [aria-label="Queue"]');return null==e?void 0:e.querySelector('[role="tablist"]')}function q(){var e,t=S(),a=f(o);a&&t&&((e=t.querySelector("#"+a))&&E(t,e),"albums-tab"!==a||u||s||(k(),isAlbumsTapOpen=u=!0),"albums-tab"===a&&u?(s=!0,T().querySelector("#album-queue-list").style.display="flex"):u&&"albums-tab"!==a&&s&&(T().querySelector("#album-queue-list").style.display="none",s=!1))}function k(){var e=f(c),t=(e.sort((e,t)=>t.addedAt-e.addedAt),f(l)),a=document.createElement("div"),e=(s||(a.style.display="none"),a.id="album-queue-list",(e=>{let t=document.createElement("div"),a=(t.id="queue-section",document.createElement("h3"));return t.appendChild(a),0===e.length?a.textContent="Nenhum album na fila":(a.textContent="Na fila",[...e].reverse().forEach(e=>{e=C(e);t.appendChild(e)})),t})(e)),t=(e=>{let t=document.createElement("div"),a=(t.id="history-section",document.createElement("h3"));return t.appendChild(a),0===e.length?a.textContent="Nenhum album no histórico":(a.textContent="Histórico de Albums",[...e].reverse().forEach(e=>{e=C(e);t.appendChild(e)})),t})(t),r=document.createElement("div"),e=(r.id="sections-wrapper",r.appendChild(e),r.appendChild(t),a.appendChild(r),T());e?e.appendChild(a):console.error(d,"Could not find host element")}function C(e){var t=document.createElement("div"),a=(t.id="album-card",document.createElement("div")),r=(a.id="card-info-wrapper",document.createElement("a")),i=(r.textContent=e.name,r.id="album-name",r.href=e.uri,e.isNIW&&((i=document.createElement("span")).id="badge",i.textContent="NIW",r.appendChild(i)),Math.min(100,Math.round(e.playedTracks/e.totalTracks*100))),l=document.createElement("div"),n=(l.id="bar-wrap",document.createElement("div")),i=(n.id="bar-fill",n.style.width=i+"%",l.appendChild(n),document.createElement("p")),n=(i.textContent=e.playedTracks+` / ${e.totalTracks} faixas`,i.id="bar-label",document.createElement("span")),o=(n.id="date-label",o=e.addedAt,new Date(o).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",year:"2-digit",hour:"2-digit",minute:"2-digit"}).replace(","," 🞄 ")),o=(n.textContent=""+o,document.createElement("p")),u=e.artist.items.map(e=>e.profile.name),u=(o.id="album-artists",o.innerHTML=`<span id="artist">${u.join(", ")}</span>`,e.userSaved&&((u=document.createElement("span")).id="heart",u.textContent="♥",o.appendChild(u)),a.appendChild(r),a.appendChild(o),a.appendChild(i),a.appendChild(n),a.appendChild(l),document.createElement("div")),r=(u.id="album-info",u.appendChild(a),document.createElement("img"));return r.src=e.coverUrl,r.alt=e.name,t.appendChild(r),t.appendChild(u),t}function A(){var e=null==(e=T())?void 0:e.querySelector("#album-queue-list");e&&(e._cleanup&&e._cleanup(),e.remove())}function E(e,t){return e.querySelectorAll('[role="tab"]').forEach(e=>{e.setAttribute("aria-selected","false"),e.setAttribute("tabindex","-1")}),t.setAttribute("aria-selected","true"),t.setAttribute("tabindex","0"),t}function T(){var e=document.querySelector('aside[aria-label="Fila"], [aria-label="Queue"]');return null==e?void 0:e.querySelector("[data-overlayscrollbars-initialize]")}d="[NIW]:",r="spicetify-sort-album",c="queued_albums",i="sorted_albums",l="history_albums",n="saved_albums",s=u=!(o="active-tab"),t=!(m={}),p=new Map,e=async function(){var e;for((e=document.createElement("style")).textContent=`
    
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
    `,document.body.appendChild(e),window.getStorage=a,window.setData=b,window.sortSavedAlbum=v,window.clearStorage=y;!(Spicetify&&Spicetify.Platform&&null!=Spicetify&&Spicetify.Player&&null!=Spicetify&&Spicetify.CosmosAsync);)console.warn(d,"Spicetify is not ready yet...!"),await new Promise(e=>setTimeout(e,100));console.log(d,"Spicetify is ready!"),e=((t,a)=>{let r;return(...e)=>{clearTimeout(r),r=setTimeout(()=>t(...e),a)}})(()=>{var e=!!document.querySelector('aside[aria-label="Fila"], aside[aria-label="Queue"]');(async()=>{let t=S();t&&t.addEventListener("click",e=>{x();var e=e.target.closest("button");e&&(e=E(t,e),b(o,e.id),q())})})(),t!==e&&((t=e)?(x(),q):(s=u=!1,A))()},100),(e=new MutationObserver(e)).observe(document.body,{childList:!0,subtree:!0}),Spicetify.Platform.PlayerAPI._queue._events._emitter.on("queue_update",async()=>{await g(),w(),A(),k()}),await!Spicetify.Player.addEventListener("songchange",async e=>{var e=e.data.item,t=e.uri,e=e.album.uri;m[e]||(m[e]={playedTracks:new Set,addedAt:Date.now()}),m[e].playedTracks.add(t)}),await g(),w()},(async()=>{await e()})()})();
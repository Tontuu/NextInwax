(async()=>{for(;!Spicetify.React||!Spicetify.ReactDOM;)await new Promise(e=>setTimeout(e,10));var n,a,l,r,i,o,s,d,c,u,m,p,y,v,b,f,e;async function g(i){i=i.querySelector("#album-queue-list");if(i){i.innerHTML='<p style="color:var(--spice-subtext);font-size:13px;padding:8px 0;">Carregando...</p>';let[e,t,a]=await Promise.all([(async()=>{var e,t;try{var a=await Spicetify.Platform.PlayerAPI.getState();let i=null!=(e=null==a?void 0:a.nextItems)?e:[],o=null==(t=null==a?void 0:a.context)?void 0:t.uri,s=new Map,u=null,d=null,c=null,m=null,p=0;return i.forEach((e,t)=>{var a=null!=(a=e.track)?a:e,e=null!=(e=null==(e=a.metadata)?void 0:e.album_uri)?e:null==(e=a.album)?void 0:e.uri,n=null!=(n=null!=(n=null==(n=a.metadata)?void 0:n.album_title)?n:null==(n=a.album)?void 0:n.name)?n:"Unknown Album",l=null!=(l=null!=(l=null==(l=a.metadata)?void 0:l.artist_name)?l:null==(l=null==(l=a.artists)?void 0:l[0])?void 0:l.name)?l:"Unknown Artist",r=null!=(a=null!=(r=null==(r=a.metadata)?void 0:r.image_url)?r:null==(r=null==(a=null==(r=a.album)?void 0:r.images)?void 0:a[0])?void 0:r.url)?a:"";e&&e!==o?(e===u?p++:(u&&1<p&&!s.has(u)&&s.set(u,{uri:u,name:d,artist:c,coverUrl:m,trackCount:p}),p=1),d=n,c=l,m=r,u=e,t===i.length-1&&1<p&&!s.has(e)&&s.set(e,{uri:e,name:n,artist:l,coverUrl:r,trackCount:p})):(u=null,p=0)}),[...s.values()]}catch(e){return console.error(y,"Failed to get queue albums:",e),[]}})(),Promise.resolve(I()),h()]);Object.fromEntries(t.map(e=>[e.uri,e]));var o=t.map(e=>{var t;return"played"===e.status?e:(t=null==(t=e.trackUris)?void 0:t.some(e=>a.has(e)),c(d({},e),{status:t?"queued":"played"}))}),s=o.filter(q);U("sorted_albums",o),o.filter(e=>"queued"===e.status);i.innerHTML="";let n=document.createElement("div");n.id="queue-section";o=document.createElement("h3"),o=(o.style=w(),o.textContent="Na Fila",0===e.length?(o.textContent="Nenhum album na fila",n.appendChild(o)):(n.appendChild(o),e.forEach(e=>{n.appendChild(x(e,{badge:void 0!==e.index?"NIW":null}))})),i.appendChild(n),document.createElement("div"));let l=document.createElement("div");var u=document.createElement("h3");let r=document.createElement("button");u.textContent="Historico de albums",r.textContent="Limpar fila",r.style.cssText=`
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
    `,o.style.cssText=`
    display: flex;
    justify-content: space-between;
    align-items: end;
    `,r.addEventListener("mouseenter",()=>{r.style.transform="scale(1.04)",r.style.color="var(--text-base)"}),r.addEventListener("mouseleave",()=>{r.style.transform="scale(1.0)",r.style.color="var(--spice-subtext)"}),r.addEventListener("click",()=>{P(I(),!0),g(m.overlay)}),o.id="history-section-header",r.id="history-section-clear-button",l.id="history-section",u.style=w(),l.style.marginTop="24px",o.appendChild(u),o.appendChild(r),l.appendChild(o),0===s.length?(u.textContent="Nenhum album tocado ainda",r.style.display="none"):[...s].reverse().forEach(e=>{var t;l.appendChild(x(e,{badge:"NIW",progress:null!=(t=e.playedTracks)?t:0,total:e.numTracks}))}),i.appendChild(l)}}function x(e,{badge:t=null,progress:a=null,total:n=null}={}){let l,r,i,o=document.createElement("div");o.id="album-card",o.style.cssText=`
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px;
        border-radius: 6px;
        margin-bottom: 4px;
        transition: background 0.15s;
    `,o.addEventListener("mouseenter",()=>o.style.background="var(--spice-highlight)"),o.addEventListener("mouseleave",()=>o.style.background="transparent");var s=document.createElement("img"),u=(s.src=null!=(l=e.coverUrl)?l:"",s.alt=e.name,s.style.cssText=`
        width:48px;
        height:48px;
        border-radius:4px;
        object-fit:cover;
        flex-shrink:0;
        background:var(--spice-card);
    `,document.createElement("div"));u.style.cssText="flex:1; min-width:0; max-width: 60%;";let d=document.createElement("div");d.textContent=null!=(r=e.name)?r:"Unknown Album",d.style.cssText=`
        color:var(--spice-text);
        text-decoration: none;
        font-size:14px;
        font-weight:600;
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
        cursor: pointer;
    `,d.addEventListener("click",()=>{Spicetify.Platform.History.push("/album/"+e.uri.split(":")[2])}),d.addEventListener("mouseenter",()=>d.style.textDecoration="underline"),d.addEventListener("mouseleave",()=>d.style.textDecoration="none");var c,m,p=document.createElement("div"),y=(p.textContent=null!=(i=e.artist)?i:"Unknown Artist",p.style.cssText=`
        color:var(--spice-subtext);
        font-size:13px;
        white-space:nowrap;
        overflow:hidden;
        text-overflow:ellipsis;
        margin-top:2px;
    `,document.createElement("div"));return y.id="album-info-wrapper",y.appendChild(d),y.appendChild(p),null!==a&&n&&(p=Math.min(100,Math.round(a/n*100)),(c=document.createElement("div")).style.cssText="margin-top:5px;height:3px;background:var(--spice-card);border-radius:2px;overflow:hidden;",(m=document.createElement("div")).style.cssText=`width:${p}%;height:100%;background:var(--spice-text);border-radius:2px;transition:width 0.3s;`,c.appendChild(m),(p=document.createElement("div")).textContent=a+` / ${n} faixas`,p.style.cssText="color:var(--spice-subtext);font-size:11px;margin-top:3px;",y.appendChild(c),y.appendChild(p)),u.appendChild(y),o.appendChild(s),o.appendChild(u),t&&((m=document.createElement("span")).textContent=t,m.style.cssText=`
            margin-left: 40px;
            font-size:10px;
            font-weight:700;
            padding:2px 6px;
            border-radius:99px;
            background:var(--spice-button);
            color:var(--spice-text);
            flex-shrink:0;
            letter-spacing:0.5px;
        `,o.appendChild(m)),o}async function h(){var e,t,a;try{var n=await Spicetify.Platform.PlayerAPI.getState(),l=null!=(a=null!=(t=null==n?void 0:n.nextItems)?t:null==(e=null==n?void 0:n.queue)?void 0:e.nextItems)?a:[];return new Set(l.map(e=>{var t;return null!=(t=e.uri)?t:null==(t=e.track)?void 0:t.uri}).filter(Boolean))}catch(e){return console.error(y,"Failed to read queue state: ",e),new Set}}function w(){var e=document.createElement("style");return e.innerHTML=`
    color:var(--spice-subtext);
    font-size:11px;
    font-weight:700;
    letter-spacing:1px;
    text-transform:uppercase;
    margin:0 0 8px 0;
    `,e}async function k(e){var t=Spicetify.GraphQL.Definitions.queryAlbumTracks,{data:t,errors:e}=await Spicetify.GraphQL.Request(t,{uri:e,offset:0,limit:100});if(e)console.error(y,"Error trying to search for album:",e);else if(!1===t.albumUnion.playability.playable)console.error(y,"Album not available");else{e=(null!=(t=null!=(e=null==(e=t.albumUnion)?void 0:e.tracksV2)?e:null==(e=t.albumUnion)?void 0:e.tracks)?t:{items:[]}).items.filter(({track:e})=>e.playability.playable).map(({track:e})=>({uri:e.uri}));if(e.length)return e;console.error(y,"No track available")}}function S(){var e,t,a=document.querySelector('#Desktop_PanelContainer_Id [role="tablist"]');return a.querySelector("#albums-tab")||(console.log(y,"Generating albums tab"),(e=a.querySelector("button").cloneNode(!0)).textContent="Albums",e.id="albums-tab",e.setAttribute("data-encore-tab-id","albums-tab"),e.setAttribute("aria-controls","albums-panel"),e.setAttribute("aria-selected","false"),e.setAttribute("tabIndex","-1"),e.dataset.tab="albums",a.appendChild(e)),e=a,(t=O("active-tab"))&&(t=e.querySelector("#"+t))&&T(e,t),a}function T(e,t){e.querySelectorAll('[role="tab"]').forEach(e=>{e.setAttribute("aria-selected","false"),e.setAttribute("tabindex","-1")}),t.setAttribute("aria-selected","true"),t.setAttribute("tabindex","0")}function E(){console.log(y,"Generating Albums View");var e,t=document.querySelector('aside[aria-label="Fila"], [aria-label="Queue"]').querySelector("[data-overlayscrollbars-initialize]");if(t&&!document.getElementById("album-queue-overlay"))return t.style.position="relative",(e=document.createElement("div")).id="album-queue-overlay",e.style.cssText=`
        position: absolute;
        inset: 0;
        z-index: 10;
        background: var(--spice-sidebar);
        overflow-y: auto;
        display: none;
    `,e.innerHTML='<div id="album-queue-list" style="padding: 16px; width: 100%;"></div>',t.appendChild(e),e}function A(){var e=m.overlay;e&&(e._cleanup&&e._cleanup(),e.remove(),m.overlay=null,console.warn(y,"Albums View Destroyed"))}function C(e,t){e.style.display=t?"flex":"none",m.isMounted=t}async function t(){var a=Spicetify.Player.data.item;if(a){let t=null==(r=null==a?void 0:a.album)?void 0:r.uri,n=a.uri,e=I(),l=await h();!e.some(e=>e.uri===t)&&t&&(null!=(i=null==(i=null==(i=null==(r=null==(r=null==(r=await Spicetify.Platform.PlayerAPI.getState())?void 0:r.nextItems)?void 0:r[0])?void 0:r.track)?void 0:i.metadata)?void 0:i.album_uri)?i:null==(i=null==r?void 0:r.album)?void 0:i.uri)===t&&(r=await k(t),console.log(y,"Organic album detected, saving..."),i={index:null,uri:t,name:null!=(i=null==(i=a.album)?void 0:i.name)?i:"Unknown Album",artist:null!=(i=null==(i=a.artists[0])?void 0:i.name)?i:"Unknown Artist",coverUrl:null!=(a=null==(i=null==(a=null==(i=a.album)?void 0:i.images)?void 0:a[1])?void 0:i.url)?a:"",numTracks:r.length,tracksUris:r,addedAt:Date.now(),status:"queued",playedTracks:1},console.log(y,"Sorted Albumns2:",e),U("sorted_albums",e=[...e,i]));var r,i,a=e.map(e=>{var t=e.tracksUris.findIndex(e=>e.uri===n),t=0<=t?t+1:e.playedTracks,a=null==(a=e.tracksUris)?void 0:a.some(e=>l.has(e));return c(d({},e),{playedTracks:t,status:a?"queued":"played"})});U("sorted_albums",a),P(a,!1),m.overlay&&m.isMounted&&g(m.overlay)}else console.error(y,"Could not sync sorted albums")}function P(e,n){var l=e.filter(q);if(n||!(l.length<=p||l.length<=u.length)){let t=n?e.length:l.length-p,a=0;l=e.filter(e=>n?(a++,!1):!("played"===e.status&&a<t&&(a++,1)));console.warn(y,`Pruned ${t} old history entries.`),U("sorted_albums",l)}}function q(e){return"played"===e.status&&(null===e.numTracks?2<=e.playedTracks:.5<=e.playedTracks/e.numTracks)}function I(){var e;return null!=(e=O("sorted_albums"))?e:[]}function L(){return JSON.parse(localStorage.getItem(v)||"{}")}function M(){var e=I();return Array.isArray(e)?e.map(e=>"object"==typeof e?e.index:e):[]}function O(e){return JSON.parse(localStorage.getItem(v)||"{}")[e]}function U(e,t){let a=JSON.parse(localStorage.getItem(v)||"{}");return(a=a&&"object"==typeof a&&!Array.isArray(a)?a:{})[e]=t,localStorage.setItem(v,JSON.stringify(a)),a[e]}function _(){var e=JSON.parse(localStorage.getItem(v));return e.sorted_albums=[],localStorage.setItem(v,JSON.stringify(e)),m.overlay&&m.isMounted&&g(m.overlay),e}n=Object.defineProperty,a=Object.defineProperties,l=Object.getOwnPropertyDescriptors,r=Object.getOwnPropertySymbols,i=Object.prototype.hasOwnProperty,o=Object.prototype.propertyIsEnumerable,s=(e,t,a)=>t in e?n(e,t,{enumerable:!0,configurable:!0,writable:!0,value:a}):e[t]=a,d=(e,t)=>{for(var a in t=t||{})i.call(t,a)&&s(e,a,t[a]);if(r)for(var a of r(t))o.call(t,a)&&s(e,a,t[a]);return e},c=(e,t)=>a(e,l(t)),m={overlay:null,isMounted:!(u=[])},p=100,y="[NIW]:",v="spicetify-sort-album",b=Spicetify.SVGIcons.check,f=Spicetify.SVGIcons.album,e=async function(){for(console.log(y,"Last active tab: ",O("active-tab")),window.clearUsedIndexes=_,window.getStorage=L,null===M()&&(U("sorted_albums",[]),console.log(O("sorted_albums")));!(Spicetify&&Spicetify.Platform&&null!=Spicetify&&Spicetify.Player&&null!=Spicetify&&Spicetify.CosmosAsync);)console.warn(y,"Spicetify is not ready yet...!"),await new Promise(e=>setTimeout(e,100));console.log(y,"Spicetify is ready!");{let t=null,e=new MutationObserver(()=>{var e=!!document.querySelector('aside[aria-label="Fila"], aside[aria-label="Queue"]');e!==t&&!function n(e){let t="albums-tab"===O("active-tab");if(e){let a=S();a.addEventListener("click",e=>{let t=e.target.closest("button");t&&(T(a,t),U("active-tab",t.getAttribute("id")),n(!0))})}if(!e||!t)return void A();m.overlay||(m.overlay=E());m.overlay&&(C(m.overlay,!0),g(m.overlay))}(t=e)});e.observe(document.body,{childList:!0,subtree:!0})}var e;console.log(y,"Observer is ready!"),(e=document.createElement("style")).textContent=`
        @keyframes flipOut {
            from { transform: rotateY(0deg); }
            to   { transform: rotateY(90deg); }
        }
        @keyframes flipIn {
            from { transform: rotateY(90deg); }
            to   { transform: rotateY(0deg); }
        }
    `,document.head.appendChild(e),console.log(y,"Injected styles"),Spicetify.Player.addEventListener("songchange",()=>{t()}),console.log(y,"Song change listener ready!"),Spicetify.Platform.PlayerAPI.getEvents().addListener("queue_update",()=>{m.overlay&&m.isMounted&&g(m.overlay)}),console.log(y,"Queue update listener ready!"),await new Promise(e=>setTimeout(e,300)),t(),console.log(y,"Initialization sync started!"),(async()=>{u=await(async()=>{var e=await Spicetify.CosmosAsync.get("sp://core-collection/unstable/@/list/albums/all?responseFormat=protobufJson");return Array.isArray(null==e?void 0:e.item)&&0!==e.item.length?(e=e.item.map((e,t)=>({index:e.index,uri:e.albumMetadata.link,name:e.albumMetadata.name,artist:e.albumMetadata.artists[0],coverUrl:e.albumMetadata.cover,numTracks:e.albumMetadata.numTracks})),console.log(y,e.length+" albums found!"),e):(console.warn(y,"Library is empty. No albums found."),[])})(),window.albums=u;let e=(()=>{var e=new Spicetify.Topbar.Button,t=(e.label="Add random album to queue",e.icon="album",e.element.querySelector("button"));return t.classList.add("main-globalNav-link-icon"),t.style.padding="12px",t.style.backgroundColor="var(--spice-card)",t.style.perspective="200px",(t=e.element.querySelector("svg")).classList.add("Svg-sc-ytk21e-0","Svg-img-icon-medium"),t.style.color="var(--spice-text)",e})();e.element.addEventListener("click",async()=>(async e=>{let t=e.element.querySelector("svg"),a=((t=>{t.style.animation="flipOut 0.2s ease-in forwards",t.addEventListener("animationend",()=>{t.innerHTML=b,t.style.animation="flipIn 0.2s ease-out forwards"},{once:!0}),setTimeout(()=>{var e;(e=t).style.animation="flipOut 0.2s ease-in forwards",e.addEventListener("animationend",()=>{e.innerHTML=f,e.style.animation="flipIn 0.2s ease-out backwards",e.addEventListener("animationend",()=>{e.style.animation=""},{once:!0})},{once:!0})},1500)})(t),(e=>{M().length>=e&&(console.warn(y,"All indexes were used, emptying the stack..."),U("sorted_albums",I().filter(e=>"queued"===e.status)));let t=M(),a=Array.from({length:e},(e,t)=>t).filter(e=>!t.includes(e));return a[Math.floor(Math.random()*a.length)]})(u.length)),n=u[a],l=await k(n.uri);l&&(await Spicetify.addToQueue(l),await 0,await new Promise(e=>setTimeout(e,300)),e=null!=(e=null==(e=null==(e=Spicetify.Platform.PlayerAPI.getState().nextItems.find(e=>e.album.uri===n.uri))?void 0:e.album.images[1])?void 0:e.url)?e:"Not Found",e={index:n.index,uri:n.uri,name:n.name,artist:n.artist.name,numTracks:n.numTracks,coverUrl:e,tracksUris:l,addedAt:Date.now(),status:"queued",playedTracks:0},U("sorted_albums",[...I(),e]),m.overlay&&m.isMounted&&g(m.overlay),console.log(y,`${u[a].numTracks} songs from ${u[a].name} made by ${u[a].artist.name} were added to queue.`),Spicetify.showNotification(""+u[a].numTracks+` songs from ${u[a].name} made by ${u[a].artist.name} were added to queue!!! 😄`))})(e))})(),console.log(y,"Next in Wax running...")},(async()=>{await e()})()})();
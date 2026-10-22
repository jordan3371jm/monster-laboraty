import {E,MAXT} from '../data/config.js';
import {monSVG} from '../data/monart.js';

// ---- Disegni dei mostri del laboratorio: un foglio di stile con un'immagine (SVG in data URI) per livello ----
// Il carattere privato di ogni mostro (E in config.js) viene sostituito da <em class="mon m{t}"> ovunque appaia (vedi ui/coin.js).
function initMonsters(){let css='';
 for(let t=1;t<=MAXT;t++)css+='.mon.m'+t+'{background-image:url("data:image/svg+xml,'+encodeURIComponent(monSVG(t))+'")}';
 const st=document.createElement('style');st.textContent=css;document.head.appendChild(st)}
const monOf=ch=>{const t=ch.charCodeAt(0)-0xE000;return t>=1&&t<=MAXT?t:0};
export {initMonsters,monOf,E};

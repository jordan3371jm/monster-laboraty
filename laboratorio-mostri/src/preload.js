import {CH} from './data/champs.js';
import {W} from './data/config.js';

// ---- Caricamento iniziale: tutte le immagini dei mostri (public/m) prima che parta il gioco ----
// Così Portale, nemici e boss compaiono subito invece di apparire a pezzi. La barra della schermata #boot mostra l'avanzamento.
// Tetto di sicurezza: con una rete lentissima dopo maxMs il gioco parte comunque (le immagini finiscono di caricarsi dopo).
function imageList(){const s=new Set();
 CH.forEach(c=>(c.f||[]).forEach(n=>s.add(n)));
 W.forEach(w=>[...Object.values(w.en).flat(),...w.bm,...w.tw].forEach(x=>{if(typeof x==='string'&&x[0]==='@')s.add(x.slice(1))}));
 return [...s].map(n=>'m/'+n+'.webp')}
const keep=[]; // riferimenti alle immagini: restano decodificate in memoria
function preload(onP,maxMs=25000){
 if(/jsdom/i.test(navigator.userAgent))return Promise.resolve(); // test automatici: niente rete
 const L=imageList();let done=0;onP(0,L.length);
 return new Promise(res=>{if(!L.length)return res();const t=setTimeout(res,maxMs);
  const ok=()=>{done++;onP(done,L.length);if(done>=L.length){clearTimeout(t);res()}};
  L.forEach(u=>{const im=new Image();keep.push(im);im.decoding='async';
   im.onload=()=>(im.decode?im.decode().catch(()=>{}):Promise.resolve()).then(ok);im.onerror=ok;im.src=u})})}
// Barra e percentuale della schermata di caricamento (in index.html)
function bootProgress(d,n){const p=n?Math.round(d/n*100):100,b=document.getElementById('bootBar'),t=document.getElementById('bootPct');
 if(b)b.style.width=p+'%';if(t)t.textContent=(t.getAttribute('data-l')||'')+' '+p+'%'}
export {preload,bootProgress,imageList};

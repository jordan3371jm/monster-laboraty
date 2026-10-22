import {CH} from './data/champs.js';
import {W} from './data/config.js';

// ---- Caricamento iniziale delle immagini dei mostri (public/m) ----
// Tutte partono subito, ma la schermata #boot aspetta solo quelle che servono appena si entra: nemici e boss del mondo
// raggiunto e i capisquadra. I ritratti degli altri campioni (Portale) finiscono di caricarsi mentre si gioca.
// Tetto di sicurezza: con una rete lentissima dopo maxMs il gioco parte comunque.
const url=n=>'m/'+n+'.webp';
const worldImgs=w=>{const s=new Set();if(w)[...Object.values(w.en).flat(),...w.bm,...w.tw].forEach(x=>{if(typeof x==='string'&&x[0]==='@')s.add(x.slice(1))});return s};
function imageList(){const s=new Set();
 W.forEach(w=>worldImgs(w).forEach(n=>s.add(n))); // prima i nemici (servono subito), poi i campioni
 CH.forEach(c=>(c.f||[]).forEach(n=>s.add(n)));
 return [...s].map(url)}
const keep=[],P={}; // riferimenti alle immagini (restano decodificate in memoria) e promessa di ciascuna
function preload(){
 if(/jsdom/i.test(navigator.userAgent))return; // test automatici: niente rete
 imageList().forEach(u=>{const im=new Image();keep.push(im);im.decoding='async';
  P[u]=new Promise(ok=>{im.onload=()=>(im.decode?im.decode().catch(()=>{}):Promise.resolve()).then(ok);im.onerror=ok});im.src=u})}
// Aspetta le immagini indispensabili: names = nomi delle forme (es. dei capisquadra), wd = mondo raggiunto
function preWait(onP,wd,names,maxMs=25000){const set=worldImgs(W[Math.min(W.length,wd||1)-1]);(names||[]).forEach(n=>set.add(n));
 const L=[...set].map(url).filter(u=>P[u]);let done=0;onP(0,L.length);
 return new Promise(res=>{if(!L.length)return res();const t=setTimeout(res,maxMs);
  L.forEach(u=>P[u].then(()=>{done++;onP(done,L.length);if(done>=L.length){clearTimeout(t);res()}}))})}
// Barra e percentuale della schermata di caricamento (in index.html)
function bootProgress(d,n){const p=n?Math.round(d/n*100):100,b=document.getElementById('bootBar'),t=document.getElementById('bootPct');
 if(b)b.style.width=p+'%';if(t)t.textContent=(t.getAttribute('data-l')||'')+' '+p+'%'}
export {preload,preWait,bootProgress,imageList};

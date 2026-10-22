import {$} from '../core/dom.js';
import {R} from '../core/state.js';

function fx(el,c){el.classList.remove(c);void el.offsetWidth;el.classList.add(c)}
let tt0;function toast(m,hi){const n=Date.now();if(!hi&&n<R.tkT)return;if(hi)R.tkT=n+2600; // i messaggi importanti (trofei, nuovi mostri) non vengono coperti
 const t=$('toast');t.textContent=m;t.style.opacity=1;clearTimeout(tt0);tt0=setTimeout(()=>t.style.opacity=0,2400)}
function setT(id,h){const e=$(id);if(e._h!==h){e._h=h;e.innerHTML=h}}
// Particelle emoji che schizzano da un elemento (rispetta «riduci animazioni»)
function burst(el,sym,n,at){if(!el||(typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches))return;
 for(let i=0;i<n;i++){const p=document.createElement('span'),a=Math.random()*6.283,d=26+Math.random()*34;p.className='pt';p.textContent=sym[i%sym.length];if(at){p.style.left=at.x+'px';p.style.top=at.y+'px'}
  p.style.setProperty('--x',Math.cos(a)*d+'px');p.style.setProperty('--y',Math.sin(a)*d+'px');p.style.setProperty('--r',(Math.random()*160-80)+'deg');el.appendChild(p);setTimeout(()=>p.remove(),750)}}
// Schede in cima a un pannello (Missioni, Timer, Portale, Collezione, Impostazioni): una sezione per volta, pallino rosso dove c'è qualcosa da fare
function tabs(id,labels,cur,dots){setT(id,labels.map((n,k)=>'<button class="b'+(k===cur?' on':'')+'" data-t="'+k+'">'+n+(dots&&dots[k]?'<i class="dot"></i>':'')+'</button>').join(''))}
const onTab=(id,fn)=>{$(id).onclick=e=>{const b=e.target.closest('[data-t]');if(b)fn(+b.dataset.t)}};
// Scheda da mostrare all'apertura: quella attuale se ha qualcosa da fare, altrimenti la prima che ne ha
const pickTab=(cur,dots)=>dots[cur]?cur:(k=>k<0?cur:k)(dots.findIndex(Boolean));
export {fx,toast,setT,burst,tabs,onTab,pickTab};

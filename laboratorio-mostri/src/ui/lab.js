import {sfx} from '../audio.js';
import {$} from '../core/dom.js';
import {R,S} from '../core/state.js';
import {fmt,hueOf} from '../core/util.js';
import {E,MAXT,N} from '../data/config.js';
import {tr,trv} from '../data/text.js';
import {AD_MERGES,amMax,earn,eggInt,freeCell,incBase,mergePairs,slots,spCost,spT} from '../game/economy.js';
import {onMerge} from '../game/timers.js';
import {save} from '../save.js';
import {disc} from './collection.js';
import {burst,toast} from './common.js';
import {track} from '../analytics.js';
import {ui} from './hud.js';
import {prog} from './missions.js';
import {tutNext} from './tutorial.js';
import {label,mergeFly,shock} from './juice.js';
import {luckAdd} from '../game/meta.js';

function pairIdx(){const g=S.g;for(let t=1;t<MAXT;t++){const ix=[];g.forEach((v,i)=>{if(v===t)ix.push(i)});if(ix.length>1)return ix.slice(0,2)}return[]}
// rarità per l'aspetto della vasca: 0 comune, 1 raro, 2 epico, 3 leggendario (conta la posizione nel mondo)
const rar=t=>{const q=(t-1)%13;return q<4?0:q<8?1:q<11?2:3};
const grid=$('grid');
for(let i=0;i<N;i++){const d=document.createElement('div');d.className='c';d.dataset.i=i;grid.appendChild(d)}
grid.onclick=e=>{if(Date.now()-dragEnd<350)return;const c=e.target.closest('.c');if(c)tap(+c.dataset.i)};
// ---- Trascinare per unire (come nei merge più giocati): si prende un mostro e lo si lascia su un altro uguale (unione)
// o su una cella vuota (spostamento). Il tocco su due celle continua a funzionare.
let drag=null,dragEnd=0;
const cellAt=(x,y)=>{const el=document.elementFromPoint(x,y);const c=el&&el.closest&&el.closest('#grid .c');return c&&c.style.display!=='none'?c:null};
grid.addEventListener('pointerdown',e=>{const c=e.target.closest('.c');if(!c||!S.g[+c.dataset.i]||e.button>0)return;
 drag={i:+c.dataset.i,x:e.clientX,y:e.clientY,id:e.pointerId,on:false,gh:null,tg:null}});
addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;
 if(!drag.on){if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<12)return; // sotto i 12px è un tocco
  drag.on=true;const c=grid.children[drag.i],r=c.getBoundingClientRect(),g=document.createElement('div');g.className='dg';
  g.innerHTML=c.innerHTML;g.style.fontSize=getComputedStyle(c).fontSize;g.style.width=r.width+'px';g.style.height=r.height+'px';g.style.setProperty('--h',getComputedStyle(c).getPropertyValue('--h'));
  document.body.appendChild(g);drag.gh=g;c.classList.add('dragf');R.sel=-1;draw();sfx('tap')}
 drag.gh.style.left=e.clientX+'px';drag.gh.style.top=e.clientY+'px';
 const t=cellAt(e.clientX,e.clientY);if(t!==drag.tg){if(drag.tg)drag.tg.classList.remove('dt','dtm');drag.tg=t;
  if(t&&+t.dataset.i!==drag.i){const j=+t.dataset.i;t.classList.add(S.g[j]===S.g[drag.i]&&S.g[j]<MAXT?'dtm':'dt')}}},{passive:true});
const endDrag=e=>{if(!drag||(e&&e.pointerId!==drag.id))return;const d=drag;drag=null;if(!d.on)return;dragEnd=Date.now();
 d.gh.remove();grid.children[d.i].classList.remove('dragf');if(d.tg)d.tg.classList.remove('dt','dtm');
 const t=e&&e.type==='pointerup'?cellAt(e.clientX,e.clientY):null;
 if(t&&+t.dataset.i!==d.i&&S.g[d.i]){const j=+t.dataset.i,g=S.g;
  if(g[j]&&g[j]!==g[d.i]){[g[j],g[d.i]]=[g[d.i],g[j]];[S.gv[j],S.gv[d.i]]=[S.gv[d.i],S.gv[j]];R.sel=-1;sfx('move');save();draw()} // mostri diversi: si scambiano di posto
  else{R.sel=d.i;tap(j);if(R.sel>=0){R.sel=-1;draw()}}}else draw()};
addEventListener('pointerup',endDrag);addEventListener('pointercancel',endDrag);
function pop(i,n=6){const el=grid.children[i];el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop');if(n)burst(grid,['✨','⭐','💫'],n,{x:el.offsetLeft+el.offsetWidth/2,y:el.offsetTop+el.offsetHeight/2})} // le particelle stanno nella griglia, non nella cella: draw() riscrive il contenuto delle celle
function drop(i){const el=grid.children[i];el.classList.remove('drop','pop');void el.offsetWidth;el.classList.add('drop');burst(grid,['💧','✨'],3,{x:el.offsetLeft+el.offsetWidth/2,y:el.offsetTop+el.offsetHeight*.8})}
// Ogni AD_MERGES unioni (a mano, «Unisci tutto» o automatiche) parte un interstitial (la piattaforma ne tiene almeno 60s tra uno e l'altro)
function adCount(n){if(S.tut<3)return;S.mga+=n;if(S.mga>=AD_MERGES){S.mga=0;R.adPend=1}} // la mostra loop.js alla prima pausa
function merged(i,n){adCount(n);disc(S.g[i]);pop(i,4+Math.min(8,S.g[i]));shock(grid.children[i],S.g[i],S.g[i]>=8);prog('merge',n);S.ach.mg+=n;track('first_merge');tutNext(3)}
// Solo per le unioni fatte a mano: combo (unioni entro CMB_T ms l'una dall'altra danno monete crescenti, fino a x10)
// e «fusione perfetta» (probabilità LUCK di saltare un livello; non durante il tutorial). Premiano chi gioca attivamente.
// Varianti dorate: GOLD_P per ogni uovo, GOLD_M per un'unione a mano (oltre a due dorati che si uniscono)
const LUCK=.06,CMB_T=2500,GOLD_P=.03,GOLD_M=.04;
function goldRoll(i,p){if(S.tut<3||S.gv[i]||Math.random()>=p)return;S.gv[i]=1;prog('gold',1);toast(tr('gold'),1);sfx('new');label(grid.children[i],'✨ ×3','lucky')}
function handBonus(i){const g=S.g,el=grid.children[i],n=Date.now();prog('hand',1);
 R.cmb=n-R.cmbT<CMB_T?R.cmb+1:1;R.cmbT=n;
 if(R.cmb>=2){const c=incBase()*.5*Math.min(R.cmb,10);earn(c);label(el,tr('combo')+' x'+R.cmb+' · 🪙+'+fmt(c),'cmb')}
 goldRoll(i,GOLD_M);
 if(S.tut>=3&&g[i]<MAXT&&Math.random()<LUCK+luckAdd()){S.disc[g[i]-1]=1;g[i]++;toast(tr('lucky'),1);sfx('new');label(el,'✨ '+tr('luckyS'),'lucky')}}
function tap(i){const g=S.g;
 if(R.sel<0){if(g[i]){R.sel=i;sfx('tap')}}
 else if(R.sel===i)R.sel=-1;
 else if(!g[i]){g[i]=g[R.sel];g[R.sel]=0;S.gv[i]=S.gv[R.sel];S.gv[R.sel]=0;R.sel=-1;sfx('move')}
 else if(g[i]===g[R.sel]&&g[i]<MAXT){mergeFly(grid.children[R.sel],grid.children[i],g[i]+1);S.gv[i]=S.gv[i]&&S.gv[R.sel]?1:0;S.gv[R.sel]=0;g[i]++;g[R.sel]=0;R.sel=-1;handBonus(i);sfx('merge',g[i]);merged(i,1);if(onMerge(g[i]))toast('📜 '+trv('ordRdy'),1);save()}
 else{R.sel=i;sfx('tap')}
 draw()}
// Unisci tutto / Unione automatica: solo fino al livello amMax(); n = quante unioni al massimo (l'automatica ne fa una per volta)
function mergeAll(lim,max){const m=mergePairs(S.g,S.gv,max||amMax(),lim),n=m.length;adCount(n);let od=false;m.forEach((x,k)=>{disc(x.t);if(onMerge(x.t))od=true;pop(x.i,k>=m.length-3?6:0);if(k>=m.length-3)shock(grid.children[x.i],0,false)});if(od)toast('📜 '+trv('ordRdy'),1);
 if(n){R.sel=-1;track('first_merge');prog('merge',n);S.ach.mg+=n;sfx('mall',n);tutNext(3);save();draw()}
 return n}
function draw(){const g=S.g,hl=S.tut===1?pairIdx():[],sl=slots();grid.dataset.r=Math.ceil(sl/4);for(let i=0;i<N;i++){const el=grid.children[i],t=g[i],h=hl.includes(i),k=t+'|'+(i===R.sel)+'|'+h+'|'+(i<sl)+'|'+(t&&S.gv[i]?1:0);
  if(el._v!==(i<sl)){el._v=i<sl;el.style.display=i<sl?'':'none'}
 if(el._k!==k){el._k=k;el.innerHTML=t?'<i>'+E[t-1]+'</i>':'';el.dataset.t=t||'';el.dataset.r=t?rar(t):'';el.style.setProperty('--h',hueOf(t));el.classList.toggle('f',!!t);el.classList.toggle('sel',i===R.sel);el.classList.toggle('hl',h);el.classList.toggle('gold',!!(t&&S.gv[i]))}}}
$('spawn').onclick=()=>{const c=spCost(),i=freeCell();if(i<0){sfx('err');return toast(trv('full'))}if(S.c<c)return;S.c-=c;S.sp++;S.ach.sp++;S.g[i]=spT();S.gv[i]=0;for(let t=1;t<=spT();t++)S.disc[t-1]=1;prog('spawn',1);sfx('spawn');tutNext(1);track('first_spawn');goldRoll(i,GOLD_P);save();draw();drop(i);ui()};
// Incubatrice automatica: un uovo gratis ogni eggInt() secondi in una cella libera (non conta per prezzo, missioni e statistiche delle uova)
function autoEgg(dt){const iv=eggInt();if(!iv){R.eggT=0;return}if((R.eggT+=dt)<iv)return;const i=freeCell();if(i<0){R.eggT=iv;return}
 R.eggT=0;const t=spT();S.g[i]=t;S.gv[i]=0;for(let k=1;k<=t;k++)S.disc[k-1]=1;goldRoll(i,GOLD_P);draw();drop(i)}
$('mall').onclick=()=>{if(Date.now()<R.mallT)return;if(mergeAll())R.mallT=Date.now()+Math.max(5,20-S.up.a)*1000;else{sfx('err');toast(trv('nomerge'))}ui()};
export {draw,pop,mergeAll,rar,autoEgg};

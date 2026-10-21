import {sfx} from '../audio.js';
import {$} from '../core/dom.js';
import {R,S} from '../core/state.js';
import {hueOf} from '../core/util.js';
import {E,MAXT,N} from '../data/config.js';
import {trv} from '../data/text.js';
import {freeCell,mergePairs,slots,spCost,spT} from '../game/economy.js';
import {onMerge} from '../game/timers.js';
import {save} from '../save.js';
import {disc} from './collection.js';
import {burst,toast} from './common.js';
import {track} from '../analytics.js';
import {ui} from './hud.js';
import {prog} from './missions.js';
import {tutNext} from './tutorial.js';
import {mergeFly,shock} from './juice.js';

function pairIdx(){const g=S.g;for(let t=1;t<MAXT;t++){const ix=[];g.forEach((v,i)=>{if(v===t)ix.push(i)});if(ix.length>1)return ix.slice(0,2)}return[]}
// rarità per l'aspetto della vasca: 0 comune, 1 raro, 2 epico, 3 leggendario (conta la posizione nel mondo)
const rar=t=>{const q=(t-1)%13;return q<4?0:q<8?1:q<11?2:3};
const grid=$('grid');
for(let i=0;i<N;i++){const d=document.createElement('div');d.className='c';d.dataset.i=i;grid.appendChild(d)}
grid.onclick=e=>{const c=e.target.closest('.c');if(c)tap(+c.dataset.i)};
function pop(i,n=6){const el=grid.children[i];el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop');if(n)burst(grid,['✨','⭐','💫'],n,{x:el.offsetLeft+el.offsetWidth/2,y:el.offsetTop+el.offsetHeight/2})} // le particelle stanno nella griglia, non nella cella: draw() riscrive il contenuto delle celle
function drop(i){const el=grid.children[i];el.classList.remove('drop','pop');void el.offsetWidth;el.classList.add('drop');burst(grid,['💧','✨'],3,{x:el.offsetLeft+el.offsetWidth/2,y:el.offsetTop+el.offsetHeight*.8})}
function merged(i,n){disc(S.g[i]);pop(i,4+Math.min(8,S.g[i]));shock(grid.children[i],S.g[i],S.g[i]>=8);prog('merge',n);S.ach.mg+=n;track('first_merge');tutNext(2)}
function tap(i){const g=S.g;
 if(R.sel<0){if(g[i]){R.sel=i;sfx('tap')}}
 else if(R.sel===i)R.sel=-1;
 else if(!g[i]){g[i]=g[R.sel];g[R.sel]=0;R.sel=-1;sfx('move')}
 else if(g[i]===g[R.sel]&&g[i]<MAXT){mergeFly(grid.children[R.sel],grid.children[i],g[i]+1);g[i]++;g[R.sel]=0;R.sel=-1;sfx('merge',g[i]);merged(i,1);if(onMerge(g[i]))toast('📜 '+trv('ordRdy'),1);save()}
 else{R.sel=i;sfx('tap')}
 draw()}
function mergeAll(){const m=mergePairs(S.g),n=m.length;let od=false;m.forEach((x,k)=>{disc(x.t);if(onMerge(x.t))od=true;pop(x.i,k>=m.length-3?6:0);if(k>=m.length-3)shock(grid.children[x.i],0,false)});if(od)toast('📜 '+trv('ordRdy'),1);
 if(n){R.sel=-1;track('first_merge');prog('merge',n);S.ach.mg+=n;sfx('mall',n);tutNext(2);save();draw()}
 return n}
function draw(){const g=S.g,hl=S.tut===1?pairIdx():[],sl=slots();grid.dataset.r=Math.ceil(sl/4);for(let i=0;i<N;i++){const el=grid.children[i],t=g[i],h=hl.includes(i),k=t+'|'+(i===R.sel)+'|'+h+'|'+(i<sl);
  if(el._v!==(i<sl)){el._v=i<sl;el.style.display=i<sl?'':'none'}
 if(el._k!==k){el._k=k;el.innerHTML=t?'<i>'+E[t-1]+'</i>':'';el.dataset.t=t||'';el.dataset.r=t?rar(t):'';el.style.setProperty('--h',hueOf(t));el.classList.toggle('f',!!t);el.classList.toggle('sel',i===R.sel);el.classList.toggle('hl',h)}}}
$('spawn').onclick=()=>{const c=spCost(),i=freeCell();if(i<0){sfx('err');return toast(trv('full'))}if(S.c<c)return;S.c-=c;S.sp++;S.ach.sp++;S.g[i]=spT();for(let t=1;t<=spT();t++)S.disc[t-1]=1;prog('spawn',1);sfx('spawn');tutNext(1);track('first_spawn');save();draw();drop(i);ui()};
$('mall').onclick=()=>{if(Date.now()<R.mallT)return;if(mergeAll())R.mallT=Date.now()+Math.max(5,20-3*S.up.a)*1000;else{sfx('err');toast(trv('nomerge'))}ui()};
export {draw,pop,mergeAll,rar};

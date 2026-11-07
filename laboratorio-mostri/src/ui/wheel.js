import {sfx} from '../audio.js';
import {$} from '../core/dom.js';
import {R,S} from '../core/state.js';
import {fmt} from '../core/util.js';
import {tr} from '../data/text.js';
import {AMV_MS,dayNum,freeCell,give,rBase,spT} from '../game/economy.js';
import {addT,addTm} from '../game/meta.js';
import {save} from '../save.js';
import {track} from '../analytics.js';
import {adThen} from './ads.js';
import {burst,toast} from './common.js';
import {draw} from './lab.js';

// ---- Ruota della fortuna (pagina Bonus): un giro gratis al giorno e altri WH_ADS giri guardando un video ----
// 8 spicchi con probabilità diverse (w); il premio si decide prima del giro e la ruota si ferma su quello spicchio.
const WH_ADS=2;
const WH=[{k:'c',ic:'🪙',m:3,w:25},{k:'t',ic:'🎫',n:2,w:12},{k:'x2',ic:'⚡',w:12},{k:'e',ic:'🔮',w:12},{k:'C',ic:'🪙',m:12,w:15},{k:'tm',ic:'📘',n:3,w:12},{k:'egg',ic:'🥚',n:2,w:9},{k:'J',ic:'💎',m:36,w:3}];
const SEG=360/WH.length;
const whDay=()=>{const d=dayNum();if(!S.wh||S.wh.d!==d)S.wh={d,f:0,a:0};return S.wh};
const whFree=()=>!whDay().f,whAds=()=>WH_ADS-whDay().a;
// Essenze del premio: crescono con quelle già ottenute (radice), almeno 1
const whEss=()=>Math.max(1,Math.floor(Math.sqrt(S.essT||0)/3));
const label=p=>'<b>'+p.ic+'</b>'+(p.k==='c'||p.k==='C'||p.k==='J'?fmt(rBase()*p.m):p.k==='e'?fmt(whEss()):p.k==='x2'?'x2 10m':'×'+p.n);
function pick(){let r=Math.random()*WH.reduce((s,p)=>s+p.w,0);for(let i=0;i<WH.length;i++){r-=WH[i].w;if(r<0)return i}return 0}
function grantW(p){
 if(p.m){const c=Math.floor(rBase()*p.m);give(c,0);return '🪙 +'+fmt(c)}
 if(p.k==='e'){const e=whEss();give(0,e);return '🔮 +'+fmt(e)}
 if(p.k==='t'){addT(p.n);return '🎫 +'+p.n}
 if(p.k==='tm'){addTm(p.n);return '📘 +'+p.n}
 if(p.k==='x2'){S.boost=Math.min(Math.max(Date.now(),S.boost)+AMV_MS*2,Date.now()+3*AMV_MS);return '⚡ x2 · 10 min'}
 // uova: nelle celle libere (se il laboratorio è pieno diventano monete)
 let n=0;for(let k=0;k<p.n;k++){const i=freeCell();if(i<0)break;const t=spT();S.g[i]=t;S.gv[i]=0;for(let q=1;q<=t;q++)S.disc[q-1]=1;n++}
 if(n<p.n){const c=Math.floor(rBase()*(p.n-n));give(c,0);draw();return '🥚 +'+n+' · 🪙 +'+fmt(c)}draw();return '🥚 +'+n}
// HTML della ruota (spicchi con gradiente conico e premi in cerchio) e del pulsante giusto
function whHtml(){const w=whDay(),rot=R.whRot||0;
 let h='<div class="dh">🎡 '+tr('whT')+'</div><div class="whl"><b class="whp">▼</b><div class="whw" style="transform:rotate('+rot+'deg)">'
  +WH.map((p,i)=>'<span style="transform:rotate('+(i*SEG+SEG/2)+'deg)"><i>'+label(p)+'</i></span>').join('')+'</div><div class="whc">🎡</div></div>';
 if(whFree())h+='<button class="b g" data-a="whf">'+tr('whFree')+'</button>';
 else if(whAds()>0)h+='<button class="b o" data-a="wha">'+tr('whAd').replace('{n}',whAds())+'</button>';
 else h+='<div class="dc">'+tr('whBack')+'</div>';
 return h+(R.whLast?'<div class="dc whr">'+tr('whWin').replace('{p}',R.whLast)+'</div>':'')}
// Giro: la ruota gira 5 volte e si ferma con lo spicchio vinto sotto la freccia; il premio arriva alla fine (3,4 s)
function spin(after){const box=document.querySelector('.whw');if(!box||R.whSpin)return;const i=pick(),p=WH[i];
 R.whSpin=1;R.whLast='';const cur=R.whRot||0,base=cur-cur%360;R.whRot=base+360*5+(360-(i*SEG+SEG/2));
 box.style.transform='rotate('+R.whRot+'deg)';box.classList.add('go');sfx('spawn');
 setTimeout(()=>{R.whSpin=0;box.classList.remove('go');R.whLast=grantW(p);if(p.k==='J')burst(box,['💎','🪙','✨'],18);sfx(p.k==='J'?'win':'claim');
  toast('🎡 '+R.whLast,p.k==='J');track('wheel',{k:p.k});save(true);after()},3400)}
function whClick(a,after){
 if(a==='whf'&&whFree()&&!R.whSpin){whDay().f=1;save(true);spin(after);return true}
 if(a==='wha'&&whAds()>0&&!R.whSpin){adThen('wheel',()=>{whDay().a++;spin(after)});return true}
 return false}
export {whHtml,whClick,whFree};

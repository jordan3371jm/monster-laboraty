import {sfx} from '../audio.js';
import {hidden} from '../core/env.js';
import {prog} from './missions.js';
import {$} from '../core/dom.js';
import {R,S} from '../core/state.js';
import {fmt} from '../core/util.js';
import {tr} from '../data/text.js';
import {earn,give,rBase} from '../game/economy.js';
import {save} from '../save.js';
import {adThen,inter} from './ads.js';
import {setT,toast} from './common.js';
import {track} from '../analytics.js';
import {gearRar,grant} from '../game/meta.js';
import {RAR,ALB} from '../data/champs.js';

// ---- Finestra «bentornato» / avvisi (raddoppio offline con pubblicità) ----
function openWB(h){setT('wbB',h);$('wb').classList.add('on')}
function showOff(o,secs,nb,nc,nm,ne){R.offA=o;const m=Math.floor(secs/60),t=m>=60?Math.floor(m/60)+'h '+m%60+'m':m+'m';
 openWB('<div class="wbi">🌙</div><div class="wbh">'+tr('wbT')+'</div><div class="dc">'+tr('wbAway')+' '+t+'</div><div class="wbc">🪙 +'+fmt(o)+'</div>'+(nb?'<div class="dc">⚔️ '+tr('wbBat')+': +'+nb+' · 🪙 +'+fmt(nc)+'</div>':'')+(nm||ne?'<div class="dc">'+[nm?'🔄 '+tr('wbMrg').replace('{n}',nm):'',ne?'🐣 '+tr('wbEgg').replace('{n}',ne):''].filter(Boolean).join(' · ')+'</div>':'')
 +'<button class="b o" data-a="wd">'+tr('wbDbl')+' · 🪙 +'+fmt(o)+'</button><button class="b g" data-a="wc">'+tr('wbOk')+'</button>')}
$('wb').onclick=e=>{const b=e.target.closest('[data-a]');if(!b)return;
 if(b.dataset.a==='wc'){$('wb').classList.remove('on');R.chR=null;if(R.wbInter){const p=R.wbInter;R.wbInter='';inter(p)}} // interstitial solo alla chiusura del cambio mondo
else if(b.dataset.a==='cd')adThen('chest',()=>{if(!R.chR)return;chApply(R.chR);toast('🎁 '+chTxt(R.chR),1);sfx('claim');$('wb').classList.remove('on');R.chR=null});
 else if(b.dataset.a==='wd')adThen('offline',()=>{earn(R.offA);toast('🪙 +'+fmt(R.offA));sfx('claim');$('wb').classList.remove('on')})};

// ---- Forzieri dei boss ----
// comune/raro/epico: monete (minuti di guadagni), Essenze e boost x2. «Bottino dei boss» alza la probabilità di rarità.
const CHR=[{c:2,e:()=>Math.random()<.3?1:0,b:()=>Math.random()<.25?300:0},{c:5,e:()=>1+(Math.random()<.5?1:0),b:()=>Math.random()<.4?300:0},{c:12,e:()=>3+(Math.random()*3|0),b:()=>600}],CHI=['📦','🎁','💎'];
const chTxt=r=>'🪙 +'+fmt(r.c)+(r.e?' · 🔮 +'+r.e:'')+(r.b?' · ⚡x2 '+r.b/60+'m':'');
function chApply(r){give(r.c,r.e);if(r.b)S.boost=Math.max(Date.now(),S.boost)+r.b*1000}
// Extra dei forzieri (non raddoppiati dalla pubblicità): biglietti del Portale, equipaggiamento, figurine
const xTxt=x=>x?[x.t?'🎫 +'+x.t:'',x.gear?RAR[x.gear.r]+'🎒':'',x.cd?ALB[x.cd.a].c[x.cd.k]:''].filter(Boolean).join(' · '):'';
function chest(){const q=Math.random(),pe=.08+.04*S.pk.b,k=q<pe?2:q<pe+.3?1:0,d=CHR[k];
 const r={k,c:Math.floor(rBase()*d.c),e:d.e(),b:d.b()};chApply(r); // R.chR solo per la finestra aperta: un secondo forziere che arriva intanto non cambia ciò che raddoppia il video
 const x={t:[1,2,3][k]};if(k||Math.random()<.35)x.g=gearRar([0,.2,.45][k]);if(Math.random()<.5)x.card=1;const xt=xTxt(grant(x));S.ach.ch++;prog('chest',1);track('first_boss');sfx('new');save();
 // finestra solo se si sta guardando la battaglia: nel laboratorio un popup a ogni boss interrompeva le unioni (il premio è già accreditato)
 if($('wb').classList.contains('on')||hidden()||!$('batV').classList.contains('on'))toast(CHI[k]+' '+tr('ch'+k)+' · '+chTxt(r)+' · '+xt,1);
 else{R.chR=r;openWB('<div class="wbi">'+CHI[k]+'</div><div class="wbh">'+tr('ch'+k)+'</div><div class="wbc">'+chTxt(r).replace(/ · /g,'<br>')+'</div><div class="dc">'+xt+'</div><button class="b o" data-a="cd">'+tr('chDbl')+'</button><button class="b g" data-a="wc">'+tr('chOk')+'</button>')}}
export {openWB,showOff,CHR,CHI,chTxt,chApply,chest};

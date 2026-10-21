import {sfx} from '../audio.js';
import {$} from '../core/dom.js';
import {S} from '../core/state.js';
import {fmt} from '../core/util.js';
import {tr} from '../data/text.js';
import {EL} from '../game/combat.js';
import {dayNum,give,rBase} from '../game/economy.js';
import {GR,claimLong,grDone,onProg} from '../game/timers.js';
import {save} from '../save.js';
import {adThen} from './ads.js';
import {setT,toast} from './common.js';
import {ui} from './hud.js';
import {track} from '../analytics.js';

// 3 missioni al giorno: una di unioni, una di battaglia e una di economia/eventi, a rotazione.
function mkMissions(d){const k=d%3,mx=Math.max(0,...S.g);
 const bat=['win','winEl','ability'].filter(x=>x!=='ability'||mx>=4),eco=['spawn','upg','event'];
 const b=bat[d%bat.length],e=eco[(d+Math.floor(d/3))%eco.length];
 const N={merge:[20,25,30][k],win:[3,3,4][k],winEl:k>1?3:2,ability:[4,5,6][k],spawn:12+k*3,upg:2,event:[2,2,3][k]};
 return[{t:'merge'},{t:b,...(b==='winEl'?{el:Math.floor(d/3)%3}:{})},{t:e}].map(m=>({...m,n:N[m.t],p:0,c:0}))}
// Missione settimanale: più lunga, a rotazione (la settimana inizia il lunedì)
const WK=[{t:'merge',n:300},{t:'win',n:25},{t:'ability',n:40},{t:'event',n:12},{t:'spawn',n:150}];
const weekNum=()=>Math.floor((dayNum()+3)/7),weekLeft=()=>7-(dayNum()+3)%7;
function mkWeekly(w){const mx=Math.max(0,...S.g);let i=w%WK.length;if(WK[i].t==='ability'&&mx<4)i=(i+1)%WK.length;return{...WK[i],p:0,c:0}}
function dayCheck(){const d=dayNum();if(S.dl.d!==d){S.dl.d=d;S.dl.m=mkMissions(d)}
 const w=weekNum();if(S.dl.wk!==w||!S.dl.w){S.dl.wk=w;S.dl.w=mkWeekly(w)}}
function prog(t,n,el){const f=m=>{if(m&&m.t===t&&m.p<m.n&&(m.el===undefined||m.el===el))m.p=Math.min(m.n,m.p+n)};S.dl.m.forEach(f);f(S.dl.w);onProg(t,n)} // anche i timer di ritorno (evento settimanale) avanzano con le missioni
// Scudo serie: se salti esattamente un giorno e hai lo scudo, la serie continua (si ricarica riscuotendo il 7° giorno)
const dailyInfo=()=>{const d=dayNum(),can=S.dl.last!==d,gap=d-S.dl.last,sv=can&&gap===2&&S.dl.sh>0&&S.dl.st>0,st=can?(gap===1||sv?S.dl.st:0):S.dl.st,done=can?st%7:(st-1)%7+1;return{can,st,done,sv,coins:Math.floor(rBase()*2*(1+.4*done))}};
function claimD(){const i=dailyInfo();if(!i.can)return;const e=i.done===6?1:0;if(i.sv){S.dl.sh=0;track('shield_used')}S.dl.st=i.st+1;S.dl.last=dayNum();const got=claimLong(); // traguardi 7/14/28 giorni: arrivano da soli
 if(i.done===6)S.dl.sh=1;track('first_daily');track('daily_claim',{streak:S.dl.st});S.dl.lr={c:i.coins,e};S.dl.dbl=0;give(i.coins,e);toast('🎁 🪙 +'+fmt(i.coins)+(e?' 🔮 +1':''));sfx('claim');setTimeout(()=>got.forEach(g=>toast('🔥 '+tr('stkGot').replace('{d}',g.d).replace('{c}',fmt(g.c)).replace('{x}',(g.e?' · 🔮 +'+g.e:'')+(g.mon?' · 🐲':'')),1)),900);save(true)}
function claimM(i,k){const m=S.dl.m[i];if(!m||m.c||m.p<m.n)return;m.c=1;const c=Math.floor(rBase()*k);give(c,0);toast('🪙 +'+fmt(c));sfx('claim');save()}
function claimW(k){const m=S.dl.w;if(!m||m.c||m.p<m.n)return;m.c=1;const c=Math.floor(rBase()*8*k);give(c,1);toast('🪙 +'+fmt(c)+' · 🔮 +1');sfx('claim');save(true)}
const mText=m=>tr('m_'+m.t).replace('{n}',m.n).replace('{e}',m.el===undefined?'':EL[m.el]);
function renderDaily(){const i=dailyInfo();let h='<div class="dc">🔥 '+tr('streak')+': <b>'+i.st+'</b> '+tr('days')+'</div><div class="dc">'+(i.sv?tr('shieldUse'):S.dl.sh?tr('shieldOn'):tr('shieldOff'))+'</div><div class="pips">';
 for(let k=0;k<7;k++)h+='<div class="pip'+(k<i.done?' done':'')+(i.can&&k===i.done?' cur':'')+'">'+(k===6?'🔮':'')+'x'+(1+.4*k).toFixed(1)+'</div>';
 h+='</div>';
 if(i.can)h+='<button class="b g" data-a="cd">🎁 '+tr('claim')+' · 🪙 '+fmt(i.coins)+(i.done===6?' + 🔮1':'')+'</button>';
 else{h+='<div class="dc">'+tr('back')+'</div>';if(S.dl.lr&&!S.dl.dbl)h+='<button class="b o" data-a="dd">'+tr('dbl')+' · 🪙 '+fmt(S.dl.lr.c)+'</button>'}
 h+='<div class="dh">'+tr('stkT')+'</div>'; // calendario lungo: 7 / 14 / 28 giorni, premi consegnati da soli
 GR.forEach(g=>{const ok=grDone(g.d),p=Math.min(1,i.st/g.d);
  h+='<div class="ms'+(ok?' ok':'')+'"><div>'+tr('stk'+g.d)+'<small>'+Math.min(i.st,g.d)+'/'+g.d+'</small><small class="d">'+(g.mon?tr('stkMon')+' · ':'')+(g.hp&&!g.mon?tr('stkHp')+' · ':'')+'🪙'+(g.e?' · 🔮 '+g.e:'')+'</small><div class="bar"><i style="width:'+(ok?100:p*100)+'%"></i></div></div><div class="mb">'+(ok?'<b>✓ '+tr('claimed')+'</b>':'')+'</div></div>'});
 h+='<div class="dh">'+tr('mis')+'</div>';
 S.dl.m.forEach((m,k)=>{const ok=m.p>=m.n,c=Math.floor(rBase());
  h+='<div class="ms'+(ok?' ok':'')+'"><div>'+mText(m)+'<small>'+m.p+'/'+m.n+'</small><div class="bar"><i style="width:'+m.p/m.n*100+'%"></i></div></div><div class="mb">'
  +(m.c?'<b>✓ '+tr('claimed')+'</b>':ok?'<button class="b g" data-a="cm" data-i="'+k+'">'+tr('claim')+' 🪙'+fmt(c)+'</button><button class="b o" data-a="dm" data-i="'+k+'">▶ x2</button>':'<span>🪙 '+fmt(c)+'</span>')+'</div></div>'});

 const w=S.dl.w;if(w){const ok=w.p>=w.n,c=Math.floor(rBase()*8);
  h+='<div class="dh">'+tr('weekly')+' · '+weekLeft()+' '+tr('wkLeft')+'</div><div class="ms wk'+(ok?' ok':'')+'"><div>'+mText(w)+'<small>'+fmt(w.p)+'/'+fmt(w.n)+'</small><div class="bar"><i style="width:'+w.p/w.n*100+'%"></i></div></div><div class="mb">'
  +(w.c?'<b>✓ '+tr('claimed')+'</b>':ok?'<button class="b g" data-a="cw">'+tr('claim')+' 🪙'+fmt(c)+' 🔮1</button><button class="b o" data-a="dw">▶ x2</button>':'<span>🪙 '+fmt(c)+' · 🔮 1</span>')+'</div></div>'}
 setT('dBody',h)}
const openDaily=()=>{renderDaily();$('daily').classList.add('on')};
$('tDaily').onclick=openDaily;$('dClose').onclick=()=>$('daily').classList.remove('on');
$('dBody').onclick=e=>{const b=e.target.closest('[data-a]');if(!b||b.disabled)return;const a=b.dataset.a,i=+b.dataset.i;
 if(a==='cd')claimD();
 else if(a==='dd')adThen('daily',()=>{const r=S.dl.lr;if(!r||S.dl.dbl)return;S.dl.dbl=1;give(r.c,r.e);toast('🪙 +'+fmt(r.c));sfx('claim')});
 else if(a==='cm')claimM(i,1);
 else if(a==='dm')adThen('daily',()=>claimM(i,2));
 else if(a==='cw')claimW(1);
 else if(a==='dw')adThen('daily',()=>claimW(2));
 renderDaily();ui()};
export {mkMissions,mkWeekly,dayCheck,prog,claimW,dailyInfo,claimD,claimM,renderDaily,openDaily};

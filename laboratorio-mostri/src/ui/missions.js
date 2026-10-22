import {sfx} from '../audio.js';
import {$} from '../core/dom.js';
import {S} from '../core/state.js';
import {fmt} from '../core/util.js';
import {tr} from '../data/text.js';
import {EL} from '../game/combat.js';
import {dayNum,give,rBase} from '../game/economy.js';
import {REW,claimable,lists,misCheck,msLeft} from '../game/missions.js';
import {GR,claimLong,grDone,onProg} from '../game/timers.js';
import {save} from '../save.js';
import {adThen} from './ads.js';
import {setT,toast} from './common.js';
import {ui} from './hud.js';
import {track} from '../analytics.js';
import {addT,psAdd} from '../game/meta.js';

// Le missioni (giornaliere, settimanali, mensili) hanno una schermata tutta loro (#mis, pulsante 📋); la logica è in game/missions.js.
// Il pannello #daily resta per il bonus giornaliero e il calendario della serie.
const dayCheck=()=>misCheck(prog);
function prog(t,n,el){const f=m=>{if(m&&m.t===t&&m.p<m.n&&(m.el===undefined||m.el===el))m.p=Math.min(m.n,m.p+n)};lists().forEach(l=>(l||[]).forEach(f));onProg(t,n);if(t==='merge')psAdd(n,'m')} // anche i timer di ritorno (evento settimanale) avanzano con le missioni
// Scudo serie: se salti esattamente un giorno e hai lo scudo, la serie continua (si ricarica riscuotendo il 7° giorno)
const dailyInfo=()=>{const d=dayNum(),can=S.dl.last!==d,gap=d-S.dl.last,sv=can&&gap===2&&S.dl.sh>0&&S.dl.st>0,st=can?(gap===1||sv?S.dl.st:0):S.dl.st,done=can?st%7:(st-1)%7+1;return{can,st,done,sv,coins:Math.floor(rBase()*2*(1+.4*done))}};
function claimD(){const i=dailyInfo();if(!i.can)return;const e=i.done===6?1:0;if(i.sv){S.dl.sh=0;track('shield_used')}S.dl.st=i.st+1;S.dl.last=dayNum();const got=claimLong(); // traguardi 7/14/28 giorni: arrivano da soli
 if(i.done===6)S.dl.sh=1;track('first_daily');track('daily_claim',{streak:S.dl.st});S.dl.lr={c:i.coins,e};S.dl.dbl=0;give(i.coins,e);addT(e?2:1);psAdd(30);prog('bonus',1);toast('🎁 🪙 +'+fmt(i.coins)+(e?' 🔮 +1':'')+' 🎫 +'+(e?2:1));sfx('claim');setTimeout(()=>got.forEach(g=>toast('🔥 '+tr('stkGot').replace('{d}',g.d).replace('{c}',fmt(g.c)).replace('{x}',(g.e?' · 🔮 +'+g.e:'')+(g.mon?' · 🐲':'')),1)),900);save(true)}
// Riscuoti la missione i della lista k (0 giorno, 1 settimana, 2 mese); x=2 dopo il video. Le missioni riscosse fanno avanzare quelle più lunghe.
function claim(k,i,x){const m=(lists()[k]||[])[i];if(!m||m.c||m.p<m.n)return;m.c=1;const r=REW[k],c=Math.floor(rBase()*r.c*x),t=r.t*x;
 give(c,r.e);addT(t);psAdd(r.pe);if(k<2)prog(k?'wmis':'dmis',1);track('mission',{k,t:m.t});
 toast('🪙 +'+fmt(c)+(r.e?' · 🔮 +'+r.e:'')+' · 🎫 +'+t,k>0);sfx(k?'win':'claim');save(true)}
const mText=m=>tr('m_'+m.t).replace('{n}',fmt(m.n)).replace('{e}',m.el===undefined?'':EL[m.el]);
function renderDaily(){const i=dailyInfo();let h='<div class="dc">🔥 '+tr('streak')+': <b>'+i.st+'</b> '+tr('days')+'</div><div class="dc">'+(i.sv?tr('shieldUse'):S.dl.sh?tr('shieldOn'):tr('shieldOff'))+'</div><div class="pips">';
 for(let k=0;k<7;k++)h+='<div class="pip'+(k<i.done?' done':'')+(i.can&&k===i.done?' cur':'')+'">'+(k===6?'🔮':'')+'x'+(1+.4*k).toFixed(1)+'</div>';
 h+='</div>';
 if(i.can)h+='<button class="b g" data-a="cd">🎁 '+tr('claim')+' · 🪙 '+fmt(i.coins)+(i.done===6?' + 🔮1':'')+'</button>';
 else{h+='<div class="dc">'+tr('back')+'</div>';if(S.dl.lr&&!S.dl.dbl)h+='<button class="b o" data-a="dd">'+tr('dbl')+' · 🪙 '+fmt(S.dl.lr.c)+'</button>'}
 h+='<div class="dh">'+tr('stkT')+'</div>'; // calendario lungo: 7 / 14 / 28 giorni, premi consegnati da soli
 GR.forEach(g=>{const ok=grDone(g.d),p=Math.min(1,i.st/g.d);
  h+='<div class="ms'+(ok?' ok':'')+'"><div>'+tr('stk'+g.d)+'<small>'+Math.min(i.st,g.d)+'/'+g.d+'</small><small class="d">'+(g.mon?tr('stkMon')+' · ':'')+(g.hp&&!g.mon?tr('stkHp')+' · ':'')+'🪙'+(g.e?' · 🔮 '+g.e:'')+'</small><div class="bar"><i style="width:'+(ok?100:p*100)+'%"></i></div></div><div class="mb">'+(ok?'<b>✓ '+tr('claimed')+'</b>':'')+'</div></div>'});
 setT('dBody',h)}
const openDaily=()=>{renderDaily();$('daily').classList.add('on')};
$('tDaily').onclick=openDaily;$('dClose').onclick=()=>$('daily').classList.remove('on');
$('dBody').onclick=e=>{const b=e.target.closest('[data-a]');if(!b||b.disabled)return;const a=b.dataset.a;
 if(a==='cd')claimD();
 else if(a==='dd')adThen('daily',()=>{const r=S.dl.lr;if(!r||S.dl.dbl)return;S.dl.dbl=1;give(r.c,r.e);toast('🪙 +'+fmt(r.c));sfx('claim')});
 renderDaily();ui()};

// ---- Schermata Missioni: tre schede, ognuna con 5 missioni e il tempo che manca al rinnovo ----
let tab=0;
const left=k=>{const ms=msLeft(k),h=Math.floor(ms/36e5),d=Math.floor(h/24);return d?d+'d '+h%24+'h':h+'h '+Math.floor(ms%36e5/6e4)+'m'};
const misNew=()=>[0,1,2].some(claimable);
function renderMis(){const l=lists()[tab]||[],r=REW[tab];
 setT('misTabs',[tr('tabD'),tr('tabW'),tr('tabM')].map((n,k)=>'<button class="b'+(k===tab?' on':'')+'" data-t="'+k+'">'+n+(claimable(k)?'<i class="dot"></i>':'')+'</button>').join(''));
 let h='<div class="dc">⏳ '+tr('misNew').replace('{t}',left(tab))+'</div>';
 if(tab)h+='<div class="dc"><small>'+tr(tab>1?'misMInfo':'misWInfo')+'</small></div>';
 const done=l.filter(m=>m.c).length;h+='<div class="dh">'+done+'/'+l.length+' ✓</div>';
 l.forEach((m,i)=>{const ok=m.p>=m.n,c=Math.floor(rBase()*r.c),rw='🪙 '+fmt(c)+(r.e?' · 🔮 '+r.e:'')+' · 🎫 '+r.t;
  h+='<div class="ms'+(tab?' wk':'')+(ok?' ok':'')+'"><div>'+mText(m)+'<small>'+fmt(m.p)+'/'+fmt(m.n)+'</small><small class="d">'+rw+'</small><div class="bar"><i style="width:'+m.p/m.n*100+'%"></i></div></div><div class="mb">'
  +(m.c?'<b>✓ '+tr('claimed')+'</b>':ok?'<button class="b g" data-a="c" data-i="'+i+'">'+tr('claim')+'</button><button class="b o" data-a="x" data-i="'+i+'">📺 x2</button>':'')+'</div></div>'});
 setT('misB',h)}
function openMis(){if(!claimable(tab)){const k=[0,1,2].find(claimable);if(k!==undefined)tab=k}renderMis();$('mis').classList.add('on')}
$('tMis').onclick=openMis;$('misClose').onclick=()=>$('mis').classList.remove('on');
$('misTabs').onclick=e=>{const b=e.target.closest('[data-t]');if(!b)return;tab=+b.dataset.t;sfx('tap');renderMis()};
$('misB').onclick=e=>{const b=e.target.closest('[data-a]');if(!b||b.disabled)return;const i=+b.dataset.i,k=tab;
 if(b.dataset.a==='c')claim(k,i,1);else if(b.dataset.a==='x')adThen('mission',()=>claim(k,i,2));
 renderMis();ui()};
export {dayCheck,prog,claim,dailyInfo,claimD,renderDaily,openDaily,renderMis,openMis,misNew};

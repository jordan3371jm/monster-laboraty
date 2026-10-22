import {sfx} from '../audio.js';
import {prog} from './missions.js';
import {$} from '../core/dom.js';
import {R,S} from '../core/state.js';
import {fmt} from '../core/util.js';
import {E} from '../data/config.js';
import {tr} from '../data/text.js';
import {EXP,EXPN,ELN,NEST,NID,SH,bells,evBuy,evCan,evNeed,evPrice,evBought,evMonBonus,expClaim,expCoins,expDur,expGain,expLeft,expPow,expSpeed,expStart,expVal,
 fmtT,nidBuy,nidCost,nidDur,nidGain,nidHatch,nidK,nidLeft,nidMax,nidSpeed,ordClaim,ordList,ordOk,ordReward,weekLeft} from '../game/timers.js';
import {save} from '../save.js';
import {track} from '../analytics.js';
import {adThen} from './ads.js';
import {setT,toast} from './common.js';
import {ui} from './hud.js';
import {draw} from './lab.js';
import {CH} from '../data/champs.js';
import {busy,ch,expMulCh} from '../game/meta.js';
import {ci} from './meta.js';

// ---- Pannello «Motivi per tornare»: spedizioni, nidi d'uovo, ordini di unione, evento settimanale ----
const bar=p=>'<div class="bar"><i style="width:'+Math.max(0,Math.min(1,p))*100+'%"></i></div>';
// Conti alla rovescia e barre di tempo: l'HTML contiene solo l'orario di FINE (costante), e tickT() aggiorna i testi sul posto ogni tick.
// Così il pannello non viene ridisegnato ogni secondo e un tocco su «Riscuoti» non si perde a cavallo di un ridisegno.
const tt=e=>'<b class="tt" data-e="'+e+'"></b>';
const barT=(st,e)=>'<div class="bar"><i class="pb" data-s="'+st+'" data-e="'+e+'"></i></div>';
function tickT(){const n=Date.now(),b=$('tmB');
 b.querySelectorAll('.tt').forEach(x=>{const t=fmtT(x.dataset.e-n);if(x.textContent!==t)x.textContent=t});
 b.querySelectorAll('.pb').forEach(x=>{const s=+x.dataset.s,e=+x.dataset.e;x.style.width=Math.max(0,Math.min(100,(n-s)/Math.max(1,e-s)*100))+'%'})}
const gain=(c,e)=>'🪙 '+fmt(c)+(e?' · 🔮 '+e:'');

function secExp(){let h='<div class="dh">'+tr('expT')+'</div>';const run=S.exp.run;
 run.forEach((e,i)=>{const l=expLeft(e),x=EXP[e.q];
  h+='<div class="xc"><div class="xh">'+x.ic+(e.c>=0&&CH[e.c]?' '+ci(e.c,'sm'):'')+' '+(l>0?tr('expBack')+' '+tt(e.et):'<b class="rdy">'+tr('expRdy')+'</b>')+'</div>'+barT(e.st,e.et)
   +'<div class="xr">'+tr('expRew')+': '+gain(expCoins(e.v),expGain(e.q))+'</div><div class="xb">'
   +(l>0?'<button class="b o" data-a="xp" data-i="'+i+'">'+tr('tmSpeed')+'</button>':'<button class="b g" data-a="xc" data-i="'+i+'">'+tr('claim')+'</button>')+'</div></div>'});
 if(run.length<EXPN){const pw=expPow(),fc=Object.keys(ch().own).map(Number).filter(i=>!busy(i));if(R.expCh>=0&&!fc.includes(R.expCh))R.expCh=-1;const cm=expMulCh(R.expCh);
  h+='<div class="xc"><div class="xh">'+tr('expGo')+' · '+tr('expPow')+' <b>'+pw.toFixed(1)+'</b></div>'+(pw?'':'<div class="xr">'+tr('tmNoSquad')+'</div>')
   +(fc.length?'<div class="xr">'+tr('expCh')+':</div><div class="ecs"><button class="ech'+(R.expCh<0?' sl':'')+'" data-a="ec" data-c="-1">'+tr('expNoCh')+'</button>'+fc.map(i=>'<button class="ech'+(R.expCh===i?' sl':'')+'" data-a="ec" data-c="'+i+'">'+ci(i)+'</button>').join('')+'</div><small class="d">'+tr('expChD')+'</small>':'')+'<div class="xb">'
   +EXP.map((x,q)=>'<button class="b" data-a="xs" data-q="'+q+'"'+(pw?'':' disabled')+'><b>'+x.ic+' '+fmtT(expDur(q))+'</b><br><small>'+gain(expCoins(Math.floor(expVal(q,pw)*cm)),expGain(q))+'</small></button>').join('')+'</div></div>'}
 return h}

function secNest(){const mx=nidMax();let h='<div class="dh">'+tr('nidT')+'</div><div class="xc">';
 nidK().forEach(k=>{const d=NID[k],i=S.inc.r.findIndex(n=>n.k===k),g=nidGain({t:k});
  if(i>=0){const n=S.inc.r[i],l=nidLeft(n);
   h+='<div class="nr"><i>'+d.ic+'</i><div class="nt"><div>'+(l>0?tt(n.st+nidDur(n.t)):'<b class="rdy">'+tr('nidRdy')+'</b>')+'</div>'+barT(n.st,n.st+nidDur(n.t))+'<small>'+tr('nidGain')+' '+gain(g.c,g.e)+'</small></div>'
    +(l>0?'<button class="b o" data-a="np" data-i="'+i+'">'+tr('tmSpeed')+'</button>':'<button class="b g" data-a="nc" data-i="'+i+'">'+tr('claim')+'</button>')+'</div>'}
  else{const c=nidCost(k);
   h+='<div class="nr"><i>'+d.ic+'</i><div class="nt"><div>'+tr('nidTime')+' <b>'+fmtT(nidDur(k))+'</b> · '+tr('nidCost')+' 🪙 '+fmt(c)+'</div><small>'+tr('nidGain')+' '+gain(g.c,g.e)+'</small></div>'
    +'<button class="b" data-a="nb" data-k="'+k+'"'+(S.inc.r.length>=mx||S.c<c?' disabled':'')+'>'+tr('nidBuy')+'</button></div>'}});
 if(mx<NEST)h+='<small class="d">🔒 '+tr('nidLocked').replace('{n}',4-((S.inc.h||0)%4))+'</small>';
 return h+'</div>'}

function secOrd(){const l=ordList();if(!l.length)return '';let h='<div class="dh">'+tr('ordT')+' · '+tr('ordTier')+' '+S.ord.tier+'</div>';
 l.forEach((o,i)=>{const r=ordReward(o),lbl=(o.k==='at'?tr('ordAt'):tr('ordEx')).replace('{n}',o.ic+' '+o.t);
  h+='<div class="ms'+(ordOk(o)?' ok':'')+'"><div>'+lbl+'<small>'+(o.c===1?tr('ordDone'):o.c===2?tr('ordLost'):o.d?tr('ordRdy'):tr('ordLeft')+' '+tt(o.et))+'</small><small class="d">'+gain(r.c,r.e)+'</small></div><div class="mb">'
   +(ordOk(o)?'<button class="b g" data-a="oc" data-i="'+i+'">'+tr('claim')+'</button>':'')+'</div></div>'});
 return h}

function secEv(){const el=S.ev.el,m=S.ev.m,need=evNeed();
 let h='<div class="dh">'+tr('evT')+'</div><div class="xc"><div class="xh">'+ELN[el]+' '+tr('evName').replace('{e}',ELN[el])+' · '+tr('evLeft')+' '+weekLeft()+'d</div><small>'+tr('evDesc').replace('{e}',ELN[el])+'</small>'
  +'<div>'+tr('evProg')+': <b>'+S.ev.p+'</b> · 🎖️ '+tr('evBadge')+': <b>'+S.ev.b+'</b></div>'+bar((S.ev.tot%need)/need);
 if(m)h+='<div>'+tr('evCamp')+': '+E[m.t-1]+' '+(m.left>0?'· '+fmtT(Math.ceil(m.left/6e4)*6e4)+(evMonBonus()>1?' ✓':''):'· –')+'</div><small class="d">'+tr('evChamp')+'</small>';
 if(S.ev.got)h+='<small>'+tr('evEggGot')+'</small>';
 h+='</div>';
 SH.forEach((it,i)=>{const got=evBought(i);
  h+='<div class="ms'+(got?' ok':'')+'"><div>'+tr(it.k)+'<small>💠 '+evPrice(i)+'</small></div><div class="mb">'
   +(got?'<b>✓ '+tr('tmBought')+'</b>':'<button class="b g" data-a="eb" data-i="'+i+'"'+(evCan(i)?'':' disabled')+'>'+tr('tmBuy')+'</button>')+'</div></div>'});
 return h}

const renderTm=()=>{setT('tmB',secExp()+secNest()+secOrd()+secEv());tickT()};
const openTm=()=>{renderTm();$('tm').classList.add('on')};
const openIntro=()=>{$('intro').classList.add('on')};
function renderIntro(){setT('introB','<h2>'+tr('introT')+'</h2>'+[1,2,3,4].map(n=>'<div class="xc">'+tr('introD'+n)+'</div>').join('')+'<button class="b g" id="introOk">'+tr('introOk')+'</button>')}
$('tExp').onclick=openTm;$('tmClose').onclick=()=>$('tm').classList.remove('on');
$('intro').onclick=e=>{if(e.target.id==='introOk'||e.target.id==='intro')$('intro').classList.remove('on')};

// Campanella: il portale web non ha notifiche push, quindi i premi pronti si segnalano dentro il gioco (pallino + messaggio)
const bellTxt=b=>tr({xb:'expRdy',hb:'nidRdy',ob:'ordRdy',goEv:'evGo'}[b.a]||'expRdy');
function drawTimers(){const b=bells();$('tExp').classList.toggle('n',b.length>0);
 if(R.bell>=0&&b.length>R.bell)toast('🔔 '+bellTxt(b[b.length-1]),1);R.bell=b.length;
 if(R.evNew){R.evNew=0;toast('🎪 '+tr('evNew').replace('{n}',tr('evName').replace('{e}',ELN[S.ev.el])),1)}
 if(R.evEgg){R.evEgg=0;toast(tr('evEggGot'),1)}
 if($('tm').classList.contains('on'))renderTm();renderIntro()}

$('tmB').onclick=e=>{const b=e.target.closest('[data-a]');if(!b||b.disabled)return;const a=b.dataset.a,i=+b.dataset.i;
 if(a==='ec'){R.expCh=+b.dataset.c;sfx('tap')}
 else if(a==='xs'){const q=+b.dataset.q;if(expStart(q,R.expCh)){R.expCh=-1;sfx('spawn');toast('🧭 '+EXP[q].ic+' '+fmtT(expDur(q)));track('exp_start',{q});save(true)}}
 else if(a==='xc'){const r=expClaim(i);if(r){sfx('claim');toast('🧭 '+gain(r.c,r.e),1);track('exp_claim');prog('exp',1);save(true)}}
 else if(a==='xp')adThen('speed',()=>{if(expSpeed(i))toast('⏩ -1h')});
 else if(a==='nb'){if(nidBuy(+b.dataset.k)){sfx('spawn');track('egg_start');save(true)}}
 else if(a==='nc'){const r=nidHatch(i);if(r){sfx('new');toast('🥚 '+gain(r.c,r.e),1);track('egg_hatch');save(true)}}
 else if(a==='np')adThen('speed',()=>{if(nidSpeed(i))toast('⏩ -1h')});
 else if(a==='oc'){const r=ordClaim(i);if(r){sfx('claim');toast('📜 '+gain(r.c,r.e),1);track('order_done');prog('ord',1);save(true)}}
 else if(a==='eb'){if(evBuy(i)){sfx('claim');track('event_buy',{i});draw();save(true)}}
 renderTm();ui()};
export {drawTimers,openIntro,renderTm,openTm};

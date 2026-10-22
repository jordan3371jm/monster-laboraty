import {sfx} from '../audio.js';
import {prog} from './missions.js';
import {$} from '../core/dom.js';
import {R,S} from '../core/state.js';
import {fmt} from '../core/util.js';
import {E} from '../data/config.js';
import {tr} from '../data/text.js';
import {EXP,EXPN,ELN,NEST,NID,SH,bells,evBuy,evCan,evPrice,EVX,EVN,EV_AD,evxLeft,evxStart,evxClaim,evnLeft,evnCost,evnBuy,evnClaim,evSpeed,evOn,EVM,EV_CATCH,EV_MRG,EV_DM,EV_WM,elBonus,evMile,evMileOk,evBought,evMonBonus,expClaim,expCoins,expDur,expGain,expLeft,expPow,expSpeed,expStart,expVal,
 fmtT,nidBuy,nidCost,nidDur,nidGain,nidHatch,nidK,nidLeft,nidMax,nidSpeed,ordClaim,ordList,ordOk,ordReward,weekLeft} from '../game/timers.js';
import {save} from '../save.js';
import {track} from '../analytics.js';
import {adThen} from './ads.js';
import {onTab,pickTab,setT,tabs,toast} from './common.js';
import {ui} from './hud.js';
import {draw} from './lab.js';
import {CH} from '../data/champs.js';
import {busy,ch,expMulCh} from '../game/meta.js';
import {ci} from './meta.js';
import {elOf} from '../game/combat.js';
import {rBase} from '../game/economy.js';
import {msLeft} from '../game/missions.js';

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

// Riquadro della festa nelle schede Spedizioni e Nidi: timer separato che dà 💠 per l'evento (un video toglie 5 minuti)
const evAdTxt=()=>'📺 -'+Math.round(EV_AD/6e4)+' min';
function secEvx(){if(!evOn())return '';const x=S.ev.fx,e=ELN[S.ev.el];let h='<div class="xc evx"><div class="xh">🎪 '+tr('evxT').replace('{e}',e)+'</div><small class="d">'+tr('evxD')+'</small>';
 if(x){const l=evxLeft();h+='<div class="xh">'+EVX[x.q].ic+' '+(l>0?tr('expBack')+' '+tt(x.et):'<b class="rdy">'+tr('expRdy')+'</b>')+'</div>'+barT(x.st,x.et)+'<div class="xr">'+tr('expRew')+': 💠 '+EVX[x.q].pt+'</div><div class="xb">'
  +(l>0?'<button class="b o" data-a="fp">'+evAdTxt()+'</button>':'<button class="b g" data-a="fc">'+tr('claim')+' 💠 '+EVX[x.q].pt+'</button>')+'</div>'}
 else h+='<div class="ecs3">'+EVX.map((v,q)=>'<button class="b" data-a="fs" data-q="'+q+'"><b>'+v.ic+' '+fmtT(v.dur)+'</b><br><small>💠 '+v.pt+'</small></button>').join('')+'</div>';
 return h+'</div>'}
function secEvn(){if(!evOn())return '';const n=S.ev.fn,c=evnCost();let h='<div class="xc evx"><div class="xh">🎪 '+tr('evnT')+'</div><small class="d">'+tr('evnD')+'</small>';
 if(n){const l=evnLeft();h+='<div class="nr"><i>'+EVN.ic+'</i><div class="nt"><div>'+(l>0?tt(n.et):'<b class="rdy">'+tr('nidRdy')+'</b>')+'</div>'+barT(n.st,n.et)+'<small>'+tr('nidGain')+' 💠 '+EVN.pt+'</small></div>'
  +(l>0?'<button class="b o" data-a="np2">'+evAdTxt()+'</button>':'<button class="b g" data-a="nc2">'+tr('claim')+'</button>')+'</div>'}
 else h+='<div class="nr"><i>'+EVN.ic+'</i><div class="nt"><div>'+tr('nidTime')+' <b>'+fmtT(EVN.dur)+'</b> · '+tr('nidCost')+' 🪙 '+fmt(c)+'</div><small>'+tr('nidGain')+' 💠 '+EVN.pt+'</small></div><button class="b" data-a="nb2"'+(S.c<c?' disabled':'')+'>'+tr('nidBuy')+'</button></div>';
 return h+'</div>'}
function secNest(){const mx=nidMax();let h='<div class="dh">'+tr('nidT')+'</div><div class="xc">';
 nidK().forEach(k=>{const d=NID[k],i=S.inc.r.findIndex(n=>n.k===k),g=nidGain({t:k});
  if(i>=0){const n=S.inc.r[i],l=nidLeft(n);
   h+='<div class="nr"><i>'+d.ic+'</i><div class="nt"><div>'+(l>0?tt(n.st+nidDur(n.t)):'<b class="rdy">'+tr('nidRdy')+'</b>')+'</div>'+barT(n.st,n.st+nidDur(n.t))+'<small>'+tr('nidGain')+' '+gain(g.c,g.e)+'</small></div>'
    +(l>0?'<button class="b o" data-a="np" data-i="'+i+'">'+evAdTxt()+'</button>':'<button class="b g" data-a="nc" data-i="'+i+'">'+tr('claim')+'</button>')+'</div>'}
  else{const c=nidCost(k);
   h+='<div class="nr"><i>'+d.ic+'</i><div class="nt"><div>'+tr('nidTime')+' <b>'+fmtT(nidDur(k))+'</b> · '+tr('nidCost')+' 🪙 '+fmt(c)+'</div><small>'+tr('nidGain')+' '+gain(g.c,g.e)+'</small></div>'
    +'<button class="b" data-a="nb" data-k="'+k+'"'+(S.inc.r.length>=mx||S.c<c?' disabled':'')+'>'+tr('nidBuy')+'</button></div>'}});
 if(mx<NEST)h+='<small class="d">🔒 '+tr('nidLocked').replace('{n}',4-((S.inc.h||0)%4))+'</small>';
 return h+'</div>'}

function secOrd(){const l=ordList();if(!l.length)return '<div class="dh">'+tr('ordT')+'</div><div class="dc">'+tr('ordNone')+'</div>';let h='<div class="dh">'+tr('ordT')+' · '+tr('ordTier')+' '+S.ord.tier+'</div>';
 l.forEach((o,i)=>{const r=ordReward(o),lbl=(o.k==='at'?tr('ordAt'):tr('ordEx')).replace('{n}',o.ic+' '+o.t);
  h+='<div class="ms'+(ordOk(o)?' ok':'')+'"><div>'+lbl+'<small>'+(o.c===1?tr('ordDone'):o.c===2?tr('ordLost'):o.d?tr('ordRdy'):tr('ordLeft')+' '+tt(o.et))+'</small><small class="d">'+gain(r.c,r.e)+'</small></div><div class="mb">'
   +(ordOk(o)?'<button class="b g" data-a="oc" data-i="'+i+'">'+tr('claim')+'</button>':'')+'</div></div>'});
 return h}

// Evento della settimana: in alto la festa (elemento, quanto manca, 💠 da spendere), poi il bonus dell'elemento con la sua barra,
// «come guadagnare 💠» passo per passo, i traguardi (premi per i 💠 guadagnati) e il negozio a schede.
const evLeftTxt=()=>{const ms=msLeft(1),h=Math.floor(ms/36e5),d=Math.floor(h/24);return d?d+'d '+h%24+'h':h+'h '+Math.floor(ms%36e5/6e4)+'m'};
const mileTxt=x=>[x.t?'🎫 '+x.t:'',x.co?'🪙 '+fmt(rBase()*x.co):'',x.e?'🔮 '+x.e:'',x.boost?'⚡x2 '+x.boost+'m':'',x.egg?'🥚':''].filter(Boolean).join(' · ');
const evStep=(ic,t,v)=>'<div class="evst"><i>'+ic+'</i><span>'+t+'</span><b>'+v+'</b></div>';
function secEv(){const el=S.ev.el,e=ELN[el],m=S.ev.m,g=S.g.filter(Boolean),inEl=g.filter(t=>elOf(t)===el).length,bon=elBonus()>1,tot=S.ev.tot||0,cl=S.ev.cl||[];
 const need=Math.max(0,Math.ceil(g.length/2)-inEl);
 let h='<div class="evh e'+el+'"><i>'+e+'</i><div><small>'+tr('evT')+'</small><b>'+tr('evN'+el)+'</b><span>⏳ '+tr('evEnds').replace('{t}',evLeftTxt())+'</span></div><div class="evc"><b>💠 '+fmt(S.ev.p)+'</b><small>'+tr('evHave')+'</small></div></div>';
 h+='<div class="evb'+(bon?' on':'')+'"><div><b>'+e+' '+tr('evBonT')+'</b><em>'+(bon?'✓ +20%':'+20%')+'</em></div><small>'+tr('evBonD').replace('{e}',e)+'</small>'
  +bar(g.length?inEl/g.length/.5:0)+'<small>'+e+' '+inEl+'/'+g.length+(bon?'':' · '+tr('evBonNeed').replace('{n}',need).replace('{e}',e))+'</small></div>';
 h+='<div class="dh">'+tr('evHowT')+'</div><div class="evw">'
  +evStep('👻💎',tr('evH1'),'+'+EV_CATCH+' 💠')
  +evStep(e+'🔗',tr('evH2').replace('{e}',e).replace('{n}',EV_MRG),(S.ev.mc||0)+'/'+EV_MRG)
  +evStep('📋',tr('evH3'),'+'+EV_DM+' · +'+EV_WM)
  +evStep('🧭🥚',tr('evH5'),'+'+EVX[0].pt+'…'+EVX[2].pt)
  +'<small class="d">🥚 '+tr('evH4')+'</small></div>';
 h+='<div class="dh">'+tr('evMilT')+'</div><small class="d" style="text-align:center">'+tr('evMilD').replace('{n}',fmt(tot))+'</small><div class="evm">'
  +EVM.map((x,i)=>{const got=cl.includes(i),ok=evMileOk(i);
   return '<div class="evmi'+(got?' got':ok?' ok':'')+'"><b class="evmn">💠 '+x.p+'</b><div class="evmr"><span>'+mileTxt(x)+'</span>'+bar(tot/x.p)+'</div>'
    +(got?'<b class="rdy">✓</b>':ok?'<button class="b g" data-a="em" data-i="'+i+'">'+tr('claim')+'</button>':'<small>'+fmt(Math.min(tot,x.p))+'/'+x.p+'</small>')+'</div>'}).join('')+'</div>';
 if(m&&m.left>0)h+='<div class="xc"><div class="xh">⭐ '+tr('evCamp')+': '+E[m.t-1]+' · ⏳ '+fmtT(Math.ceil(m.left/6e4)*6e4)+(evMonBonus()>1?' · ✓ +'+Math.round((evMonBonus()-1)*100)+'%':' · ✗')+'</div><small class="d">'+tr('evChamp')+'</small></div>';
 if(S.ev.got)h+='<small class="d">'+tr('evEggGot')+'</small>';
 h+='<div class="dh">'+tr('evShop')+' · 💠 '+fmt(S.ev.p)+'</div><div class="evsh">'+SH.map((it,i)=>{const got=evBought(i);
  return '<div class="evsi'+(got?' got':'')+'"><i>'+it.ic+'</i><small>'+tr(it.k).replace(/^\S+\s/,'')+'</small>'
   +(got?'<b class="rdy">✓ '+tr('tmBought')+'</b>':'<button class="b g" data-a="eb" data-i="'+i+'"'+(evCan(i)?'':' disabled')+'>💠 '+evPrice(i)+'</button>')+'</div>'}).join('')+'</div>';
 return h}

// Una scheda per sezione: Spedizioni, Nidi, Ordini, Evento (pallino dove c'è qualcosa pronto)
let tab=0;const SEC=[secExp,secNest,secOrd,secEv],TB={xb:0,hb:1,ob:2,goEv:3,xf:0,hf:1};
const tmDots=()=>{const d=[0,0,0,0];bells().forEach(b=>{if(TB[b.a]!==undefined)d[TB[b.a]]=1});return d};
const SECX=[secEvx,secEvn,()=>'',()=>''];
const renderTm=()=>{tabs('tmTabs',['🧭','🥚','📜','🎪'].map((ic,k)=>'<b>'+ic+'</b><small>'+tr(['tbExp','tbNid','tbOrd','tbEv'][k])+'</small>'),tab,tmDots());setT('tmB',SEC[tab]()+SECX[tab]());tickT()};
onTab('tmTabs',k=>{tab=k;sfx('tap');renderTm()});
const openTm=()=>{tab=pickTab(tab,tmDots());renderTm();$('tm').classList.add('on')};
const openIntro=()=>{$('intro').classList.add('on')};
function renderIntro(){setT('introB','<h2>'+tr('introT')+'</h2>'+[1,2,3,4].map(n=>'<div class="xc">'+tr('introD'+n)+'</div>').join('')+'<button class="b g" id="introOk">'+tr('introOk')+'</button>')}
$('tExp').onclick=openTm;$('tmClose').onclick=()=>$('tm').classList.remove('on');
$('intro').onclick=e=>{if(e.target.id==='introOk'||e.target.id==='intro')$('intro').classList.remove('on')};

// Campanella: il portale web non ha notifiche push, quindi i premi pronti si segnalano dentro il gioco (pallino + messaggio)
const bellTxt=b=>tr({xb:'expRdy',hb:'nidRdy',ob:'ordRdy',goEv:'evGo',xf:'expRdy',hf:'nidRdy'}[b.a]||'expRdy');
function drawTimers(){const b=bells();$('tExp').classList.toggle('n',b.length>0);
 if(R.bell>=0&&b.length>R.bell)toast('🔔 '+bellTxt(b[b.length-1]),1);R.bell=b.length;
 if(R.evNew){R.evNew=0;toast('🎪 '+tr('evNew').replace('{n}',ELN[S.ev.el]+' '+tr('evN'+S.ev.el)),1)}
 if(R.evEgg){R.evEgg=0;toast(tr('evEggGot'),1)}
 if($('tm').classList.contains('on'))renderTm();renderIntro()}

$('tmB').onclick=e=>{const b=e.target.closest('[data-a]');if(!b||b.disabled)return;const a=b.dataset.a,i=+b.dataset.i;
 if(a==='ec'){R.expCh=+b.dataset.c;sfx('tap')}
 else if(a==='xs'){const q=+b.dataset.q;if(expStart(q,R.expCh)){R.expCh=-1;sfx('spawn');toast('🧭 '+EXP[q].ic+' '+fmtT(expDur(q)));track('exp_start',{q});save(true)}}
 else if(a==='xc'){const r=expClaim(i);if(r){sfx('claim');toast('🧭 '+gain(r.c,r.e),1);track('exp_claim');prog('exp',1);save(true)}}
 else if(a==='xp')adThen('speed',()=>{if(expSpeed(i))toast('⏩ -1h')});
 else if(a==='nb'){if(nidBuy(+b.dataset.k)){sfx('spawn');track('egg_start');save(true)}}
 else if(a==='nc'){const r=nidHatch(i);if(r){sfx('new');toast('🥚 '+gain(r.c,r.e),1);track('egg_hatch');save(true)}}
 else if(a==='np')adThen('speed',()=>{if(nidSpeed(i))toast('⏩ -5 min')});
 else if(a==='oc'){const r=ordClaim(i);if(r){sfx('claim');toast('📜 '+gain(r.c,r.e),1);track('order_done');prog('ord',1);save(true)}}
 else if(a==='fs'){if(evxStart(+b.dataset.q)){sfx('spawn');track('evx_start',{q:+b.dataset.q});save(true)}}
 else if(a==='fc'){const p=evxClaim();if(p){sfx('claim');toast('🎪 💠 +'+p,1);track('evx_claim');save(true)}}
 else if(a==='fp')adThen('speed',()=>{if(evSpeed('fx'))toast('⏩ -5 min')});
 else if(a==='nb2'){if(evnBuy()){sfx('spawn');track('evn_start');save(true)}}
 else if(a==='nc2'){const p=evnClaim();if(p){sfx('new');toast('🎪 💠 +'+p,1);track('evn_claim');save(true)}}
 else if(a==='np2')adThen('speed',()=>{if(evSpeed('fn'))toast('⏩ -5 min')});
 else if(a==='em'){const r=evMile(i);if(r){sfx('win');toast('🎪 '+[r.c?'🪙 +'+fmt(r.c):'',r.e?'🔮 +'+r.e:'',r.t?'🎫 +'+r.t:'',r.boost?'⚡x2 '+r.boost+'m':'',r.egg?'🥚':''].filter(Boolean).join(' · '),1);track('event_mile',{i});save(true)}}
 else if(a==='eb'){if(evBuy(i)){sfx('claim');track('event_buy',{i});draw();save(true)}}
 renderTm();ui()};
export {drawTimers,openIntro,renderTm,openTm};

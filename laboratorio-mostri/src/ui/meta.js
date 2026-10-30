import {sfx} from '../audio.js';
import {prog} from './missions.js';
import {$} from '../core/dom.js';
import {R,S} from '../core/state.js';
import {fmt,ico} from '../core/util.js';
import {cName,evoAt,mImg,CH,RAR,PITY_R,PITY_L,MAXSTAR,GEAR,ALB} from '../data/champs.js';
import {W} from '../data/config.js';
import {tr} from '../data/text.js';
import {EL} from '../game/combat.js';
import {rBase} from '../game/economy.js';
import * as M from '../game/meta.js';
import {fmtT} from '../game/timers.js';
import {save} from '../save.js';
import {track} from '../analytics.js';
import {adThen} from './ads.js';
import {burst,onTab,pickTab,setT,tabs,toast} from './common.js';
import {ui} from './hud.js';
import {buy} from '../platform.js';
import {priceOf} from './shop.js';

// ---- Pannelli della progressione permanente: Portale dei Campioni, Torre, Pass, Invasione, Album ----
// Immagine e nome della forma attuale del campione (cambiano con le evoluzioni)
const ci=(i,cls)=>mImg(M.form(i),cls),nm=i=>cName(M.form(i));
const pc=v=>Math.round(v*100)+'%';
const skTxt=i=>{const c=CH[i],v=M.skVal(i);return tr('sk_'+c.sk).replace('{v}',c.sk==='stun'?v.toFixed(1):pc(v)).replace('{e}',EL[c.el])};
const stars=s=>'★'.repeat(s)+'☆'.repeat(MAXSTAR-s);
const gearTxt=g=>RAR[g.r]+' '+GEAR[g.s].ic+' +'+g.v+'% '+tr('gearE'+g.s);
const rwTxt=r=>[r.tm?'📘 '+r.tm:'',r.c?'🪙 '+fmt(rBase()*r.c):'',r.e?'🔮 '+r.e:'',r.t?'🎫 '+r.t:'',r.g!==undefined?RAR[r.g]+'🎒':'',r.card?'🃏':'',r.ch!==undefined?ci(r.ch,'sm'):''].filter(Boolean).join(' ');
// Messaggio per ciò che si è appena ricevuto (biglietti, equipaggiamento, figurina, campione)
function grantMsg(o){if(!o)return;const p=[];if(o.tm)p.push('📘 +'+o.tm);if(o.co)p.push('🪙 +'+fmt(o.co));if(o.e)p.push('🔮 +'+o.e);if(o.t)p.push('🎫 +'+o.t);if(o.gear)p.push(tr('gearGot')+' '+gearTxt(o.gear));if(o.cd)p.push(tr('cardGot')+' '+ALB[o.cd.a].c[o.cd.k]);
 if(o.chr)p.push(nm(o.chr.i)+' '+stars(o.chr.s));if(p.length)toast(p.join(' · '),1)}

// ---- Portale ----
function chCard(i,extra){const s=M.star(i),c=CH[i],up=s&&M.ch().tm>0&&M.lvl(i)<M.lvCap(i);
 return '<button class="chc r'+c.r+(s?' f':'')+(R.chSel===i?' sl':'')+'" data-a="sel" data-i="'+i+'"'+(extra||'')+'><i'+(s?'':' class="u"')+'>'+ci(i)+'</i><small>'+(s?stars(s).replace(/☆/g,''):'?')+'</small>'
  +(s?'<em class="lvb">'+M.lvl(i)+'</em><u class="elb">'+EL[c.el]+'</u>':'')+(M.leaders().includes(i)?'<b class="cr">👑</b>':'')+(M.busy(i)?'<b class="cr">🧭</b>':'')+(M.ch().gym.s.includes(i)?'<b class="cr gy">🏋️</b>':'')+(up?'<i class="dot on"></i>':'')+'</button>'}
// Livello del campione: barra dell'esperienza, Tomi da usare, limite delle stelle, Palestra
function lvBlock(i){const s=M.star(i),L=M.lvl(i),cap=M.lvCap(i),c=M.ch(),need=M.xpNeed(i),inG=c.gym.s.includes(i);
 let h='<div class="clv"><div class="clh"><b>'+tr('chLv')+' '+L+'<small>/'+cap+'</small></b><span>⚡ '+fmt(M.cPow(i))+'</span></div>';
 if(L<cap)h+='<div class="bar"><i style="width:'+Math.min(100,M.xpOf(i)/need*100)+'%"></i></div><small class="d">'+M.xpOf(i)+' / '+need+' XP · 📘 = '+M.TOME_XP+' XP</small>'
  +'<div class="row3"><button class="b g" data-a="lv1" data-i="'+i+'"'+(c.tm<1?' disabled':'')+'>📘 ×1</button><button class="b g" data-a="lv10" data-i="'+i+'"'+(c.tm<1?' disabled':'')+'>📘 ×10</button><button class="b o" data-a="lvm" data-i="'+i+'"'+(c.tm<1?' disabled':'')+'>📘 '+tr('lvMax')+' ('+Math.min(c.tm,M.tomesToCap(i))+')</button></div>';
 else h+='<small class="d">'+(s<MAXSTAR?tr('lvCapTxt').replace('{s}',s+1).replace('{l}',cap+M.LV_STAR):tr('lvMaxed'))+'</small>';
 return h+'<button class="b" data-a="gym" data-i="'+i+'">🏋️ '+tr(inG?'gymOut':'gymIn')+'</button></div>'}
function detail(i){const c=CH[i],s=M.star(i),lead=S.ch.ld.includes(i),eq=S.ch.eq[i]||[0,0,0];
 let h='<div class="chd r'+c.r+'"><div class="chh"><i>'+ci(i)+'</i><div><b>'+nm(i)+'</b><small>'+RAR[c.r]+' '+tr('rar'+c.r)+' · '+EL[c.el]+'</small><small class="st">'+stars(s)+'</small>'+(s&&s<MAXSTAR?'<small>'+tr('pullCp').replace('{a}',M.cps(i)).replace('{b}',M.needCp(i))+'</small>':'')+'</div></div>'
  +(s?lvBlock(i):'')+'<div class="xr">✨ '+skTxt(i)+'</div><div class="xr">👑 '+tr('chLeadB').replace('{v}',pc(M.LEADB[c.r]*M.sMul(i)*M.lMul(i)))+'</div>'
  +(c.f.length>1?'<div class="evl">'+c.f.map((k,j)=>'<span class="'+(s>=evoAt(c)[j]?'on':'')+'">'+mImg(k)+'<small>★'+evoAt(c)[j]+'</small></span>').join('<b>›</b>')+'</div>':'')
  +(c.ex?'<small class="d">'+tr({iv:'exIv',ps:'exPs',tw:'exTw'}[c.ex])+'</small>':'');
 if(!s)return h+'</div>';
 h+=(M.busy(i)?'<div class="dc">'+tr('chBusy')+'</div>':'')+'<button class="b'+(lead?'':' g')+'" data-a="'+(lead?'unlead':'lead')+'" data-i="'+i+'">'+tr(lead?'chUnlead':'chLead')+'</button>'
  +'<div class="gs">'+[0,1,2].map(sl=>{const g=S.ch.gear.find(x=>x.id===eq[sl]);return '<button class="gsl'+(R.gearSl===sl?' sl':'')+'" data-a="slot" data-s="'+sl+'">'+GEAR[sl].ic+'<small>'+(g?'+'+g.v+'%':tr('gearFree'))+'</small></button>'}).join('')+'</div>';
 if(R.gearSl>=0){const list=S.ch.gear.filter(g=>g.s===R.gearSl).sort((a,b)=>b.v-a.v);
  h+='<div class="dh">'+tr('gearPick')+' · '+tr('gear'+R.gearSl)+'</div>'+(list.length?list.map(g=>{const on=eq[R.gearSl]===g.id;
   return '<div class="ms"><div>'+gearTxt(g)+'</div><div class="mb"><button class="b'+(on?'':' g')+'" data-a="'+(on?'un':'eq')+'" data-id="'+g.id+'" data-s="'+g.s+'">'+(on?'✕':'✓')+'</button></div></div>'}).join(''):'<small class="d">'+tr('gearNone')+'</small>')}
 return h+'</div>'}
// Portale in tre schede: Evoca, Campioni (capisquadra, scheda del campione, tutti i campioni), Equipaggiamento
let porTab=0;
const porDots=()=>{const c=M.ch(),own=Object.keys(c.own).map(Number);return[!M.freeLeft()||c.t>=1,(c.tm>0&&own.some(i=>M.lvl(i)<M.lvCap(i)))||(own.length>0&&c.gym.s.includes(-1)),0]};
function renderPor(){const c=M.ch(),fl=M.freeLeft(),al=M.adLeft();
 tabs('porTabs',['🌀','🦸','🎒'].map((ic,k)=>'<b>'+ic+'</b><small>'+tr(['tbPull','tbCh','tbGear'][k])+'</small>'),porTab,porDots());
 let h='<div class="cs">🎫 <b>'+c.t+'</b> '+tr('porTk')+'<small class="d">'+tr('porPity').replace('{n}',Math.max(1,PITY_R-c.pr)).replace('{m}',Math.max(1,PITY_L-c.pl))+'</small></div>'
  +'<div class="row"><button class="b g" data-a="x1"'+(c.t<1?' disabled':'')+'>'+tr('porX1')+' · 🎫1</button><button class="b g" data-a="x10"'+(c.t<10?' disabled':'')+'>'+tr('porX10')+' · 🎫10</button></div>'
  +'<div class="row"><button class="b'+(fl?'':' o')+'" data-a="free"'+(fl?' disabled':'')+'>'+(fl?tr('porFreeIn')+' <b class="tt" data-e="'+(c.free+M.FREE_CD)+'"></b>':tr('porFree'))+'</button><button class="b o" data-a="ad"'+(al?'':' disabled')+'>'+tr('porAd')+' · '+al+'/'+M.AD_MAX+' '+tr('porAdN')+'</button></div>'
  +'<small class="d" style="text-align:center">'+tr('porOdds')+'</small>';
 if(porTab===0){setT('porB',h);ttick('porB');return}
 h='';
 if(porTab===1){M.gymTick();const g=c.gym;
 // in alto: Tomi e Palestra (2 posti: tocca un posto per mettere il campione selezionato, toccalo di nuovo per toglierlo)
 h+='<div class="gymr"><div class="tmc"><b>📘 '+fmt(c.tm)+'</b><small>'+tr('tmName')+'</small></div>'+[0,1].map(k=>{const i=g.s[k];
   return '<button class="gys'+(i>=0?' f':'')+'" data-a="gs" data-k="'+k+'">'+(i>=0?'<i>'+ci(i,'sm')+'</i><small>'+tr('chLv')+' '+M.lvl(i)+' · +'+M.GYM_XP+' XP/h</small>':'<i>🏋️</i><small>'+tr(R.chSel>=0&&M.star(R.chSel)?'gymPut':'gymEmpty')+'</small>')+'</button>'}).join('')+'</div>';
 h+='<div class="dh">'+tr('porLd')+'</div><small class="d" style="text-align:center">'+tr('porLdD')+'</small><div class="lds">'
  +[0,1].map(k=>{const i=c.ld[k];return i===undefined?'<div class="chc e"><small>'+tr('porEmpty')+'</small></div>':chCard(i)}).join('')+'</div>';
 if(R.chSel>=0&&CH[R.chSel])h+=detail(R.chSel);
 // elenco: filtri per elemento e ordine (rarità / livello / potenza), prima i posseduti
 const F=R.chF??-1,O=R.chO||0,ids=CH.map((_,i)=>i).filter(i=>F<0||CH[i].el===F).sort((a,b)=>(!!M.star(b)-!!M.star(a))||(O===1?M.lvl(b)-M.lvl(a):O===2?M.cPow(b)-M.cPow(a):0)||CH[b].r-CH[a].r||a-b);
 h+='<div class="dh">'+tr('porAll')+' · '+Object.keys(c.own).length+'/'+CH.length+'</div><div class="chf">'+['✳️','🔥','💧','🌿'].map((x,k)=>'<button class="b'+(F===k-1?' on':'')+'" data-a="cf" data-v="'+(k-1)+'">'+x+'</button>').join('')
  +'<span></span>'+[tr('soRar'),tr('soLv'),tr('soPow')].map((x,k)=>'<button class="b'+(O===k?' on':'')+'" data-a="co" data-v="'+k+'">'+x+'</button>').join('')+'</div><div class="chg">'+ids.map(i=>chCard(i)).join('')+'</div>';
 setT('porB',h);ttick('porB');return}
 h+='<div class="dh">'+tr('gearT')+'</div><small class="d" style="text-align:center">'+tr('gearOnly')+'</small>';
 if(c.gear.length){const on={};for(const k in c.eq)c.eq[k].forEach(id=>{if(id)on[id]=k});
  h+='<button class="b" data-a="auto">'+tr('gearAuto')+'</button>'+[...c.gear].sort((a,b)=>b.r-a.r||b.v-a.v).map(g=>'<div class="ms"><div>'+gearTxt(g)+(on[g.id]!==undefined?'<small>'+tr('gearOn')+' '+nm(+on[g.id])+'</small>':'')+'</div><div class="mb"><button class="b" data-a="salv" data-id="'+g.id+'">'+tr('gearSalv')+' 🪙</button></div></div>').join('')}
 else h+='<small class="d" style="text-align:center">'+tr('gearNone')+'</small>';
 setT('porB',h);ttick('porB')}
// Conti alla rovescia aggiornati sul posto: l'HTML contiene solo l'orario di fine, così il pannello non si ridisegna ogni secondo (un tocco non si perde)
function ttick(id){const n=Date.now();$(id).querySelectorAll('.tt').forEach(x=>{const t=fmtT(x.dataset.e-n);if(x.textContent!==t)x.textContent=t})}
// Rivelazione delle evocazioni: carte che girano una dopo l'altra, i leggendari brillano
function reveal(out){if(!out||!out.length)return;prog('pull',out.length);let best=0;
 setT('pullB','<div class="wbh">'+tr('pullT')+'</div><div class="pg'+(out.length>1?' many':'')+'">'+out.map((o,k)=>{const c=CH[o.i];best=Math.max(best,c.r);
  return '<div class="pc r'+c.r+'" style="animation-delay:'+(k*.12)+'s"><i>'+ci(o.i)+'</i><b>'+nm(o.i)+'</b><small>'+(o.co!==undefined?tr('pullMax').replace('{c}',fmt(o.co))+(o.back?' · 🎫 +'+o.back:''):o.nw?'<em>'+tr('pullNew')+'</em>':o.up?'<em>'+tr(o.evo?'pullEvo':'pullUp')+'</em> '+stars(o.s):tr('pullCp').replace('{a}',o.cp).replace('{b}',o.need))+'</small></div>'}).join('')+'</div><button class="b g" data-a="ok">'+tr('pullOk')+'</button>');
 $('pull').classList.add('on');sfx(best>=2?'win':'new');if(best>=3)burst($('pullB'),['✨','🌟','💫'],18);track('pull',{n:out.length,best});save(true);renderPor();ui()}
$('pull').onclick=e=>{if(e.target.closest('[data-a=ok]'))$('pull').classList.remove('on')};
$('porB').onclick=e=>{const b=e.target.closest('[data-a]');if(!b||b.disabled)return;const a=b.dataset.a,i=+b.dataset.i;
 if(a==='x1')reveal(M.pullT(1));else if(a==='x10')reveal(M.pullT(10));else if(a==='free')reveal(M.pullFree());
 else if(a==='ad')adThen('pull',()=>reveal(M.pullAd()));
 else if(a==='sel'){R.chSel=R.chSel===i?-1:i;R.gearSl=-1;sfx('tap')}
 else if(a==='lv1'||a==='lv10'||a==='lvm'){const n=M.useTomes(i,a==='lv1'?1:a==='lv10'?10:1e9);if(n){sfx('claim');burst($('porB'),['📘','✨'],6);track('ch_lv',{i,l:M.lvl(i)});save()}}
 else if(a==='gym'){const g=M.ch().gym,k=g.s.indexOf(i);if(k>=0)M.gymSet(k,-1);else{const f=g.s.indexOf(-1);M.gymSet(f>=0?f:0,i)}sfx('tap');save()}
 else if(a==='gs'){const k=+b.dataset.k,g=M.ch().gym;if(R.chSel>=0&&M.star(R.chSel)&&g.s[k]!==R.chSel)M.gymSet(k,R.chSel);else if(g.s[k]>=0)M.gymSet(k,-1);sfx('tap');save()}
 else if(a==='cf'){R.chF=+b.dataset.v;sfx('tap')}else if(a==='co'){R.chO=+b.dataset.v;sfx('tap')}
 else if(a==='lead'||a==='unlead'){M.setLeader(i,a==='lead');sfx('claim');save()}
 else if(a==='slot'){const s=+b.dataset.s;R.gearSl=R.gearSl===s?-1:s;sfx('tap')}
 else if(a==='eq'){M.equip(R.chSel,+b.dataset.id);sfx('claim');save()}
 else if(a==='un'){M.unequip(R.chSel,+b.dataset.s);sfx('tap');save()}
 else if(a==='auto'){M.autoEquip();sfx('claim');save()}
 else if(a==='salv'){const v=M.salvage(+b.dataset.id);if(v)toast('🪙 +'+fmt(v));sfx('claim');save()}
 renderPor();ui()};

// ---- Torre giornaliera ----
const twEmo=f=>{const w=W[Math.min(W.length,S.wd)-1],s=M.twStage(f);return ico(M.twBoss(f)?w.tw[(f/5)%w.tw.length|0]:w.en.n[s%3])};
function renderTow(){M.twCheck();const tw=S.ch.tw;
 let h='<div class="cs">'+tr('twTries')+': <b>'+tw.tries+'/'+M.TW_TRIES+'</b> · '+tr('twBest')+': <b>'+tw.best+'</b> · '+tr('twRec')+': <b>'+tw.rec+'</b></div>'
  +'<div class="ulr">🏆 '+tr('permB').replace('{n}',Math.round(M.twB()*100))+' · '+tr('twNextB').replace('{n}',Math.round(M.TW_B*100))+'</div><small class="d" style="text-align:center">'+tr('twD')+'</small>';
 if(R.twRes){const r=R.twRes;h+='<div class="twf'+(r.win?' w':' l')+'"><div class="twv"><span>'+(S.ch.ld.length?S.ch.ld.map(i=>ci(i)).join(''):'🧪')+'</span><b>VS</b><span>'+twEmo(r.f)+'</span></div>'
  +'<div class="bar"><i class="twb" style="--to:'+Math.round((1-r.r)*100)+'%"></i></div><div class="wbh">'+tr(r.win?'twWin':'twLose').replace('{n}',r.f)+'</div>'
  +(r.rw&&r.rw.c!==undefined?'<div class="dc">'+[r.rw.c?'🪙 +'+fmt(r.rw.c):'',r.rw.e?'🔮 +'+r.rw.e:'',r.rw.tm?'📘 +'+r.rw.tm:'',r.rw.t?'🎫 +'+r.rw.t:'',r.rw.g?RAR[r.rw.g.r]+'🎒':'',r.rw.card?ALB[r.rw.card.a].c[r.rw.card.k]:''].filter(Boolean).join(' · ')+'</div>':'')+'</div>'}
 if(tw.buf.length)h+='<div class="dh">'+tr('twBufs')+'</div><div class="dc">'+tw.buf.map(k=>tr('buf_'+k)).join(' · ')+'</div>';
 if(!tw.run)h+=tw.tries?'<button class="b g" data-a="start">'+tr('twStart')+'</button>':'<div class="dc">'+tr('twNoTry')+'</div>';
 else if(tw.ch)h+='<div class="dh">'+tr('twPick')+'</div>'+tw.ch.map(k=>'<button class="b o" data-a="pick" data-k="'+k+'">'+tr('buf_'+k)+'</button>').join('');
 else{h+='<div class="xc"><div class="xh">'+tr('twNext')+': '+tr('twFloor')+' '+tw.f+(M.twBoss(tw.f)?' · 👑 '+tr('twBoss'):'')+'</div><div class="twe">'+twEmo(tw.f)+'</div></div>'
  +'<button class="b g" data-a="fight">'+tr('twFight').replace('{n}',tw.f)+'</button><button class="b" data-a="quit">'+tr('twQuit')+'</button>'}
 setT('towB',h)}
$('towB').onclick=e=>{const b=e.target.closest('[data-a]');if(!b||b.disabled)return;const a=b.dataset.a;
 if(a==='start'){if(M.twStart()){R.twRes=null;sfx('boss');track('tower_start')}}
 else if(a==='fight'){const r=M.twFight();if(r){R.twRes=r;sfx(r.win?'win':'lose');if(r.win&&r.rw.c!==undefined){M.psAdd(15);track('tower_floor',{f:r.f})}if(r.rw&&r.rw.chr)reveal([r.rw.chr])}}
 else if(a==='pick'){if(M.twPick(b.dataset.k)){R.twRes=null;sfx('claim')}}
 else if(a==='quit'){M.twQuit();R.twRes=null;sfx('tap')}
 save(true);renderTow();ui()};

// ---- Prove dei Campioni (Mondo 2): solo campioni, fino a 3. Si vince con abbastanza potenza; premi alla prima vittoria ----
let triRes=null;
function renderTri(){const c=M.ch(),n=(c.tri.best||0)+1,team=M.triTeam(),need=M.triNeed(n),pow=M.triPow(n,team),el=M.triEl(n),rw=M.triRew(n);
 let h='<div class="ulr">🏆 '+tr('permB').replace('{n}',Math.round(M.triB()*100))+' · '+tr('triNextB').replace('{n}',Math.round(M.TRI_B*100))+'</div><small class="d" style="text-align:center">'+tr('triD')+'</small>';
 if(triRes){const r=triRes;h+='<div class="twf'+(r.win?' w':' l')+'"><div class="wbh">'+tr(r.win?'triWin':'triLose').replace('{n}',r.n)+'</div><div class="bar"><i style="width:'+Math.min(100,r.p/r.need*100)+'%"></i></div><small class="d">⚡ '+fmt(r.p)+' / '+fmt(r.need)+'</small>'+(r.win?'<div class="dc">'+rwTxt(r.rw)+'</div>':'<div class="dc">'+tr('triHint')+'</div>')+'</div>'}
 h+='<div class="trh e'+el+'"><div><small>'+tr('triStage')+'</small><b>'+n+(M.triBoss(n)?' 👑':'')+'</b></div><div class="tre">'+EL[el]+'</div><div><small>'+tr('triNeed')+'</small><b>⚡ '+fmt(need)+'</b></div></div>';
 h+='<div class="dh">'+tr('triTeam')+' · ⚡ '+fmt(pow)+'</div><div class="trt">'+[0,1,2].map(k=>{const i=team[k];if(i===undefined)return '<div class="chc e"><small>'+tr('porEmpty')+'</small></div>';
   const adv=M.elAdv(CH[i].el,el);return chCard(i,' data-t="1"').replace('</button>','<small class="adv'+(adv>1?' up':adv<1?' dn':'')+'">'+(adv>1?'▲':adv<1?'▼':'')+' ⚡'+fmt(Math.round(M.cPow(i)*adv))+'</small></button>')}).join('')+'</div>'
  +'<div class="bar big"><i style="width:'+Math.min(100,pow/need*100)+'%"></i></div>'
  +'<button class="b '+(pow>=need?'g':'o')+'" data-a="fight"'+(pow?'':' disabled')+'>'+tr('triGo').replace('{n}',n)+'</button><small class="d" style="text-align:center">'+tr('triRw')+': '+rwTxt(rw)+'</small>';
 const own=Object.keys(c.own).map(Number).sort((a,b)=>M.cPow(b)-M.cPow(a));
 h+='<div class="dh">'+tr('triPick')+'</div><div class="chg">'+own.map(i=>chCard(i,' data-t="1"')).join('')+'</div>';
 setT('triB',h)}
$('triB').onclick=e=>{const b=e.target.closest('[data-a]');if(!b||b.disabled)return;const a=b.dataset.a;
 if(a==='sel'){M.triSet(+b.dataset.i);triRes=null;sfx('tap')}
 else if(a==='fight'){const r=M.triFight();if(r){triRes=r;sfx(r.win?'win':'lose');if(r.win){burst($('triB'),['⚔️','✨','📘'],14);track('trial',{n:r.n});if(r.rw)grantMsg(r.rw)}}}
 save(true);renderTri();ui()};

// ---- Pass stagionale ----
// Premium: «Sblocca il Premium» con un acquisto (prodotto pass_premium, solo dove la piattaforma lo vende) oppure, premio per premio,
// PS_ADS video accanto a ogni premio premium già raggiunto (al 5° video il premio arriva da solo).
let psBusy=false;
function renderPas(){M.psCheck();const p=S.ch.ps,lv=M.psLv(),xp=p.xp-lv*M.PS_XP,pr=priceOf('pass_premium');
 let h='<div class="cs">'+tr('psLv')+' <b>'+lv+'/'+M.PS_LV+'</b> · '+M.psLeft()+' '+tr('psLeft')+'<small class="d">'+tr('psD')+'</small></div>'
  +(lv<M.PS_LV?'<div class="bar"><i style="width:'+Math.round(xp/M.PS_XP*100)+'%"></i></div><small class="d" style="text-align:center">'+xp+' / '+M.PS_XP+'</small>':'');
 if(!p.prem)h+='<div class="psp"><b>👑 '+tr('psPremT')+'</b><small>'+tr('psPremD').replace('{n}',M.PS_ADS)+'</small>'
  +(pr?'<button class="b g" data-a="buy"'+(psBusy?' disabled':'')+'>'+tr('psBuy')+' · '+pr+'</button>':'')+'</div>';
 else h+='<div class="psp on"><b>👑 '+tr('psPremOn')+'</b></div>';
 if(M.psCan())h+='<button class="b g" data-a="all">'+tr('psAll')+'</button>';
 h+='<div class="psh"><span>'+tr('psLv')+'</span><span>'+tr('psFree')+'</span><span>👑 '+tr('psPrem')+'</span></div>';
 for(let l=1;l<=M.PS_LV;l++){const fr=M.psRew(l,0),pm=M.psRew(l,1),ok=l<=lv,cell=(r,isP)=>{const got=(isP?p.cp:p.cl).includes(l);
   if(got)return '<b class="rdy">'+tr('psDone')+'</b>';
   if(isP&&!p.prem){const n=M.psAds(l);return '<div class="psa"><span class="psr">'+rwTxt(r)+'</span>'+(ok?'<button class="b o" data-a="pad" data-l="'+l+'">📺 '+n+'/'+M.PS_ADS+'</button><i class="pab"><em style="width:'+n/M.PS_ADS*100+'%"></em></i>':'<small>🔒</small>')+'</div>'}
   return ok?'<button class="b g" data-a="cl" data-l="'+l+'" data-p="'+(isP?1:0)+'">'+rwTxt(r)+'</button>':'<span class="psr">'+rwTxt(r)+'</span>'};
  h+='<div class="psl'+(ok?' ok':'')+(l===M.PS_LV?' big':'')+'"><b>'+l+'</b>'+cell(fr,0)+cell(pm,1)+'</div>'}
 setT('pasB',h)}
$('pasB').onclick=async e=>{const b=e.target.closest('[data-a]');if(!b||b.disabled)return;const a=b.dataset.a;
 if(a==='buy'){if(psBusy)return;psBusy=true;renderPas();try{const g=await buy('pass_premium');if(g){sfx('win');toast('👑 '+tr('psPremOn'),1);track('pass_buy');burst($('pasB'),['👑','✨','🎟️'],16)}}catch(x){toast(tr('buyFail'))}psBusy=false}
 else if(a==='pad'){const l=+b.dataset.l;adThen('pass',()=>{const r=M.psAd(l);if(!r)return;track('pass_ad',{l,n:r.n});if(r.got){grantMsg(r.got);sfx('win');if(r.got.chr&&r.got.chr.nw)reveal([r.got.chr])}else toast('📺 '+r.n+'/'+M.PS_ADS,1)}).then(()=>{renderPas();ui()});return}
 else if(a==='cl'){const o=M.psClaim(+b.dataset.l,+b.dataset.p);if(o){grantMsg(o);sfx('claim');if(o.chr&&o.chr.nw)reveal([o.chr])}}
 else if(a==='all'){let got=null;for(let l=1;l<=M.psLv();l++)for(const pm of [0,1]){const o=M.psClaim(l,pm);if(o){got=got||{};for(const k of['t','e','co'])if(o[k])got[k]=(got[k]||0)+o[k];if(o.gear)got.gear=o.gear;if(o.cd)got.cd=o.cd;if(o.chr)got.chr=o.chr}}
  if(got){grantMsg(got);sfx('claim');if(got.chr&&got.chr.nw)reveal([got.chr])}}
 save(true);renderPas();ui()};

// ---- Invasione dei boss ----
function renderInv(){M.ivCheck();const iv=S.ch.iv,on=M.ivOn(),has=iv.wk>=0&&(on||(iv.pts>0&&!iv.cl));
 let h='<small class="d" style="text-align:center">'+tr('ivD')+'</small>';
 if(!has)h+='<div class="dc">'+tr('ivOff')+'</div>';
 else{const rows=M.ivBoard(),me=M.ivRank();
  h+='<div class="cs">'+(on?'⚔️ '+tr('ivOn'):tr('ivEnd'))+'<small class="d">'+tr('ivPts')+': <b>'+fmt(iv.pts)+'</b> · '+tr('ivRank')+': <b>'+me+'°</b></small></div>'
   +rows.map((r,k)=>'<div class="rw'+(r.me?' me':'')+'"><span>'+(k+1)+'° '+(r.me?'🧪 '+tr('ivYou'):r.n)+'</span><b>'+fmt(r.p)+'</b></div>').join('');
  if(!on&&iv.pts>0&&!iv.cl)h+='<button class="b g" data-a="claim">'+tr('ivClaim')+'</button>'}
 h+='<div class="dh">'+tr('ivRewT')+'</div><div class="dc">'+[tr('ivR1'),tr('ivR3'),tr('ivR6'),tr('ivR10')].join('<br>')+'</div>';
 setT('invB',h)}
$('invB').onclick=e=>{const b=e.target.closest('[data-a]');if(!b||b.disabled)return;
 if(b.dataset.a==='claim'){const o=M.ivClaim();if(o){toast('🏆 '+tr('ivGot').replace('{n}',o.rank),1);grantMsg(o);sfx('win');if(o.chr&&o.chr.nw)reveal([o.chr]);track('invasion',{rank:o.rank})}}
 save(true);renderInv();ui()};

// ---- Collezioni dei campioni (scheda «Campioni» della Collezione) ----
function csHtml(){const c=M.ch();let h='<small class="d" style="text-align:center">'+tr('csD').replace('{n}',M.csDone()).replace('{p}',Math.round((M.csMul()-1)*100))+'</small>';
 M.CSETS.forEach(s=>{const n=M.csHave(s),tot=s.ids.length;
  h+='<div class="css"><div class="xh"><span>'+s.ic+' '+tr('cs_'+s.k)+'</span><span>'+n+'/'+tot+'</span></div><div class="csg">'+s.ids.map(i=>chCard(i,' disabled')).join('')+'</div><div class="bar"><i style="width:'+n/tot*100+'%"></i></div><div class="csr">'
   +[0,1].map(t=>{const got=(c.cs||[]).includes(s.k+t),ok=M.csOk(s,t);return got?'<b class="rdy" style="text-align:center">✓ '+(t?tr('csAll'):tr('csHalf'))+'</b>':'<button class="b'+(ok?' g':'')+'" data-a="csc" data-k="'+s.k+'" data-t="'+t+'"'+(ok?'':' disabled')+'>'+(t?tr('csAll'):tr('csHalf'))+' ('+M.csTier(s,t)+') · '+rwTxt(M.csRew(t))+'</button>'}).join('')+'</div></div>'});
 return h}
function csClick(b){if(b.dataset.a!=='csc')return false;const o=M.csClaim(b.dataset.k,+b.dataset.t);if(o){grantMsg(o);sfx('win');save(true)}return true}

// ---- Album di figurine (dentro la Collezione) ----
function albHtml(){M.ch();let h='<div class="wh">'+tr('albT')+'</div><small class="d" style="text-align:center">'+tr('albD')+'</small>';
 ALB.forEach((al,a)=>{const n=M.albHave(a),dup=M.albDup(a),done=M.albDone(a);
  h+='<div class="cr"><div class="xh">'+al.ic+' '+tr('alb'+a)+' · '+n+'/9</div><div class="ag">'+al.c.map((e,k)=>{const q=S.ch.cards[a*9+k];return '<div class="ac'+(q?' f':'')+(k===8?' gd':'')+'"><i'+(q?'':' class="u"')+'>'+e+'</i>'+(q>1?'<small>×'+q+'</small>':'')+'</div>'}).join('')+'</div>'
   +(S.ch.alb[a]?'<b class="rdy" style="text-align:center">'+tr('albDone')+'</b>':done?'<button class="b g" data-a="acl" data-al="'+a+'">'+tr('albClaim')+'</button>':'<button class="b" data-a="atr" data-al="'+a+'"'+(dup>=3?'':' disabled')+'>'+tr('albTrade')+' ('+dup+')</button>')+'</div>'});
 return h}
const albNew=()=>{M.ch();return ALB.some((_,a)=>M.albDone(a)&&!S.ch.alb[a])};
function albClick(b){const a=+b.dataset.al;if(b.dataset.a==='acl'){if(M.albClaim(a)){toast('🃏 🎫 +'+M.ALB_T,1);sfx('win');save(true)}return true}
 if(b.dataset.a==='atr'){const r=M.albTrade(a);if(r){toast(tr('cardGot')+' '+ALB[r.a].c[r.k],1);sfx('claim');save(true)}return true}return false}

const open=(id,fn)=>()=>{fn();$(id).classList.add('on')};
$('tPor').onclick=open('por',()=>{R.chSel=-1;R.gearSl=-1;porTab=pickTab(porTab,porDots());renderPor()});
onTab('porTabs',k=>{porTab=k;R.gearSl=-1;sfx('tap');renderPor()});$('porClose').onclick=()=>$('por').classList.remove('on');
$('bTow').onclick=open('tow',()=>{R.twRes=null;renderTow()});$('towClose').onclick=()=>$('tow').classList.remove('on');
$('tPas').onclick=open('pas',renderPas);$('pasClose').onclick=()=>$('pas').classList.remove('on');
$('bInv').onclick=open('inv',renderInv);$('invClose').onclick=()=>$('inv').classList.remove('on');
$('bTri').onclick=open('tri',()=>{triRes=null;renderTri()});$('triClose').onclick=()=>$('tri').classList.remove('on');
// Ridisegno dei pannelli aperti (dal ciclo dell'interfaccia)
function metaUi(){if($('por').classList.contains('on'))renderPor();if($('tow').classList.contains('on')&&!R.twRes)renderTow();if($('pas').classList.contains('on'))renderPas();if($('inv').classList.contains('on'))renderInv();if($('tri').classList.contains('on'))renderTri()}
function metaLang(){$('porT').textContent=tr('porT');$('towT').textContent=tr('twT');$('pasT').textContent=tr('psT');$('invT').textContent=tr('ivT');$('triT').textContent='🏟️ '+tr('triT');
 ['porClose','towClose','pasClose','invClose','triClose'].forEach(id=>$(id).textContent=tr('close'));$('bTow').innerHTML=tr('bTow')+'<i class="dot"></i>';$('bInv').innerHTML=tr('bInv')+'<i class="dot"></i>';$('bTri').innerHTML='🏟️ '+tr('triT')+'<i class="dot"></i>'}
export {csHtml,csClick,ci,grantMsg,reveal,renderPor,renderTow,renderPas,renderInv,albHtml,albClick,albNew,metaUi,metaLang,nm,skTxt,stars,gearTxt};

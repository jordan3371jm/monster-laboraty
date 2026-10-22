import {sfx} from '../audio.js';
import {prog} from './missions.js';
import {$} from '../core/dom.js';
import {R,S} from '../core/state.js';
import {fmt,ico} from '../core/util.js';
import {cName,evoAt,mImg,CH,RAR,PITY_R,PITY_L,MAXSTAR,GEAR,ALB} from '../data/champs.js';
import {W} from '../data/config.js';
import {tr} from '../data/text.js';
import {EL} from '../game/combat.js';
import * as M from '../game/meta.js';
import {fmtT} from '../game/timers.js';
import {save} from '../save.js';
import {track} from '../analytics.js';
import {adThen} from './ads.js';
import {burst,setT,toast} from './common.js';
import {ui} from './hud.js';

// ---- Pannelli della progressione permanente: Portale dei Campioni, Torre, Pass, Invasione, Album ----
// Immagine e nome della forma attuale del campione (cambiano con le evoluzioni)
const ci=(i,cls)=>mImg(M.form(i),cls),nm=i=>cName(M.form(i));
const pc=v=>Math.round(v*100)+'%';
const skTxt=i=>{const c=CH[i],v=M.skVal(i);return tr('sk_'+c.sk).replace('{v}',c.sk==='stun'?v.toFixed(1):pc(v)).replace('{e}',EL[c.el])};
const stars=s=>'★'.repeat(s)+'☆'.repeat(MAXSTAR-s);
const gearTxt=g=>RAR[g.r]+' '+GEAR[g.s].ic+' +'+g.v+'% '+tr('gearE'+g.s);
const rwTxt=r=>[r.t?'🎫 '+r.t:'',r.g!==undefined?RAR[r.g]+'🎒':'',r.card?'🃏':'',r.ch!==undefined?ci(r.ch,'sm'):''].filter(Boolean).join(' ');
// Messaggio per ciò che si è appena ricevuto (biglietti, equipaggiamento, figurina, campione)
function grantMsg(o){if(!o)return;const p=[];if(o.t)p.push('🎫 +'+o.t);if(o.gear)p.push(tr('gearGot')+' '+gearTxt(o.gear));if(o.cd)p.push(tr('cardGot')+' '+ALB[o.cd.a].c[o.cd.k]);
 if(o.chr)p.push(nm(o.chr.i)+' '+stars(o.chr.s));if(p.length)toast(p.join(' · '),1)}

// ---- Portale ----
function chCard(i,extra){const s=M.star(i),c=CH[i];
 return '<button class="chc r'+c.r+(s?' f':'')+(R.chSel===i?' sl':'')+'" data-a="sel" data-i="'+i+'"'+(extra||'')+'><i'+(s?'':' class="u"')+'>'+ci(i)+'</i><small>'+(s?stars(s).replace(/☆/g,''):'?')+'</small>'+(M.leaders().includes(i)?'<b class="cr">👑</b>':'')+(M.busy(i)?'<b class="cr">🧭</b>':'')+'</button>'}
function detail(i){const c=CH[i],s=M.star(i),lead=S.ch.ld.includes(i),eq=S.ch.eq[i]||[0,0,0];
 let h='<div class="chd r'+c.r+'"><div class="chh"><i>'+ci(i)+'</i><div><b>'+nm(i)+'</b><small>'+RAR[c.r]+' '+tr('rar'+c.r)+' · '+EL[c.el]+'</small><small class="st">'+stars(s)+'</small>'+(s&&s<MAXSTAR?'<small>'+tr('pullCp').replace('{a}',M.cps(i)).replace('{b}',M.needCp(i))+'</small>':'')+'</div></div>'
  +'<div class="xr">✨ '+skTxt(i)+'</div><div class="xr">👑 '+tr('chLeadB').replace('{v}',pc(M.LEADB[c.r]*M.sMul(i)))+'</div>'
  +(c.f.length>1?'<div class="evl">'+c.f.map((k,j)=>'<span class="'+(s>=evoAt(c)[j]?'on':'')+'">'+mImg(k)+'<small>★'+evoAt(c)[j]+'</small></span>').join('<b>›</b>')+'</div>':'')
  +(c.ex?'<small class="d">'+tr({iv:'exIv',ps:'exPs',tw:'exTw'}[c.ex])+'</small>':'');
 if(!s)return h+'</div>';
 h+=(M.busy(i)?'<div class="dc">'+tr('chBusy')+'</div>':'')+'<button class="b'+(lead?'':' g')+'" data-a="'+(lead?'unlead':'lead')+'" data-i="'+i+'">'+tr(lead?'chUnlead':'chLead')+'</button>'
  +'<div class="gs">'+[0,1,2].map(sl=>{const g=S.ch.gear.find(x=>x.id===eq[sl]);return '<button class="gsl'+(R.gearSl===sl?' sl':'')+'" data-a="slot" data-s="'+sl+'">'+GEAR[sl].ic+'<small>'+(g?'+'+g.v+'%':tr('gearFree'))+'</small></button>'}).join('')+'</div>';
 if(R.gearSl>=0){const list=S.ch.gear.filter(g=>g.s===R.gearSl).sort((a,b)=>b.v-a.v);
  h+='<div class="dh">'+tr('gearPick')+' · '+tr('gear'+R.gearSl)+'</div>'+(list.length?list.map(g=>{const on=eq[R.gearSl]===g.id;
   return '<div class="ms"><div>'+gearTxt(g)+'</div><div class="mb"><button class="b'+(on?'':' g')+'" data-a="'+(on?'un':'eq')+'" data-id="'+g.id+'" data-s="'+g.s+'">'+(on?'✕':'✓')+'</button></div></div>'}).join(''):'<small class="d">'+tr('gearNone')+'</small>')}
 return h+'</div>'}
function renderPor(){const c=M.ch(),fl=M.freeLeft(),al=M.adLeft();
 let h='<div class="cs">🎫 <b>'+c.t+'</b> '+tr('porTk')+'<small class="d">'+tr('porPity').replace('{n}',Math.max(1,PITY_R-c.pr)).replace('{m}',Math.max(1,PITY_L-c.pl))+'</small></div>'
  +'<div class="row"><button class="b g" data-a="x1"'+(c.t<1?' disabled':'')+'>'+tr('porX1')+' · 🎫1</button><button class="b g" data-a="x10"'+(c.t<10?' disabled':'')+'>'+tr('porX10')+' · 🎫10</button></div>'
  +'<div class="row"><button class="b'+(fl?'':' o')+'" data-a="free"'+(fl?' disabled':'')+'>'+(fl?tr('porFreeIn')+' <b class="tt" data-e="'+(c.free+M.FREE_CD)+'"></b>':tr('porFree'))+'</button><button class="b o" data-a="ad"'+(al?'':' disabled')+'>'+tr('porAd')+' · '+al+'/'+M.AD_MAX+' '+tr('porAdN')+'</button></div>'
  +'<small class="d" style="text-align:center">'+tr('porOdds')+'</small>';
 h+='<div class="dh">'+tr('porLd')+'</div><small class="d" style="text-align:center">'+tr('porLdD')+'</small><div class="lds">'
  +[0,1].map(k=>{const i=c.ld[k];return i===undefined?'<div class="chc e"><small>'+tr('porEmpty')+'</small></div>':chCard(i)}).join('')+'</div>';
 if(R.chSel>=0&&CH[R.chSel])h+=detail(R.chSel);
 h+='<div class="dh">'+tr('porAll')+' · '+Object.keys(c.own).length+'/'+CH.length+'</div><div class="chg">'+CH.map((_,i)=>chCard(i)).join('')+'</div>';
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
 let h='<div class="cs">'+tr('twTries')+': <b>'+tw.tries+'/'+M.TW_TRIES+'</b> · '+tr('twBest')+': <b>'+tw.best+'</b> · '+tr('twRec')+': <b>'+tw.rec+'</b></div><small class="d" style="text-align:center">'+tr('twD')+'</small>';
 if(R.twRes){const r=R.twRes;h+='<div class="twf'+(r.win?' w':' l')+'"><div class="twv"><span>'+(S.ch.ld.length?S.ch.ld.map(i=>ci(i)).join(''):'🧪')+'</span><b>VS</b><span>'+twEmo(r.f)+'</span></div>'
  +'<div class="bar"><i class="twb" style="--to:'+Math.round((1-r.r)*100)+'%"></i></div><div class="wbh">'+tr(r.win?'twWin':'twLose').replace('{n}',r.f)+'</div>'
  +(r.rw&&r.rw.c!==undefined?'<div class="dc">'+[r.rw.c?'🪙 +'+fmt(r.rw.c):'',r.rw.t?'🎫 +'+r.rw.t:'',r.rw.g?RAR[r.rw.g.r]+'🎒':'',r.rw.card?ALB[r.rw.card.a].c[r.rw.card.k]:''].filter(Boolean).join(' · ')+'</div>':'')+'</div>'}
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

// ---- Pass stagionale ----
function renderPas(){M.psCheck();const p=S.ch.ps,lv=M.psLv(),xp=p.xp-lv*M.PS_XP;
 let h='<div class="cs">'+tr('psLv')+' <b>'+lv+'/'+M.PS_LV+'</b> · '+M.psLeft()+' '+tr('psLeft')+'<small class="d">'+tr('psD')+'</small></div>'
  +(lv<M.PS_LV?'<div class="bar"><i style="width:'+Math.round(xp/M.PS_XP*100)+'%"></i></div><small class="d" style="text-align:center">'+xp+' / '+M.PS_XP+'</small>':'')
  +(p.prem?'':'<button class="b o" data-a="prem">'+tr('psUnl')+'</button>')+(M.psCan()?'<button class="b g" data-a="all">'+tr('psAll')+'</button>':'')
  +'<div class="psh"><span>'+tr('psLv')+'</span><span>'+tr('psFree')+'</span><span>'+tr('psPrem')+(p.prem?'':' 🔒')+'</span></div>';
 for(let l=1;l<=M.PS_LV;l++){const fr=M.psRew(l,0),pr=M.psRew(l,1),ok=l<=lv,cell=(r,pm)=>{const got=(pm?p.cp:p.cl).includes(l);
   return got?'<b class="rdy">'+tr('psDone')+'</b>':ok&&(!pm||p.prem)?'<button class="b g" data-a="cl" data-l="'+l+'" data-p="'+pm+'">'+rwTxt(r)+'</button>':'<span class="psr">'+rwTxt(r)+'</span>'};
  h+='<div class="psl'+(ok?' ok':'')+(l===M.PS_LV?' big':'')+'"><b>'+l+'</b>'+cell(fr,0)+cell(pr,1)+'</div>'}
 setT('pasB',h)}
$('pasB').onclick=e=>{const b=e.target.closest('[data-a]');if(!b||b.disabled)return;const a=b.dataset.a;
 if(a==='prem')adThen('pass',()=>{S.ch.ps.prem=1;track('pass_premium');toast('🎟️ '+tr('psPrem')+' ✓',1)});
 else if(a==='cl'){const o=M.psClaim(+b.dataset.l,+b.dataset.p);if(o){grantMsg(o);sfx('claim');if(o.chr&&o.chr.nw)reveal([o.chr])}}
 else if(a==='all'){let got=null;for(let l=1;l<=M.psLv();l++)for(const pm of [0,1]){const o=M.psClaim(l,pm);if(o){got=got||{};if(o.t)got.t=(got.t||0)+o.t;if(o.gear)got.gear=o.gear;if(o.cd)got.cd=o.cd;if(o.chr)got.chr=o.chr}}
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

// ---- Album di figurine (dentro la Collezione) ----
function albHtml(){M.ch();let h='<div class="wh">'+tr('albT')+'</div><small class="d" style="text-align:center">'+tr('albD')+'</small>';
 ALB.forEach((al,a)=>{const n=M.albHave(a),dup=M.albDup(a),done=M.albDone(a);
  h+='<div class="cr"><div class="xh">'+al.ic+' '+tr('alb'+a)+' · '+n+'/9</div><div class="ag">'+al.c.map((e,k)=>{const q=S.ch.cards[a*9+k];return '<div class="ac'+(q?' f':'')+(k===8?' gd':'')+'"><i'+(q?'':' class="u"')+'>'+e+'</i>'+(q>1?'<small>×'+q+'</small>':'')+'</div>'}).join('')+'</div>'
   +(S.ch.alb[a]?'<b class="rdy" style="text-align:center">'+tr('albDone')+'</b>':done?'<button class="b g" data-a="acl" data-al="'+a+'">'+tr('albClaim')+'</button>':'<button class="b" data-a="atr" data-al="'+a+'"'+(dup>=3?'':' disabled')+'>'+tr('albTrade')+' ('+dup+')</button>')+'</div>'});
 return h}
function albClick(b){const a=+b.dataset.al;if(b.dataset.a==='acl'){if(M.albClaim(a)){toast('🃏 🎫 +'+M.ALB_T,1);sfx('win');save(true)}return true}
 if(b.dataset.a==='atr'){const r=M.albTrade(a);if(r){toast(tr('cardGot')+' '+ALB[r.a].c[r.k],1);sfx('claim');save(true)}return true}return false}

const open=(id,fn)=>()=>{fn();$(id).classList.add('on')};
$('tPor').onclick=open('por',()=>{R.chSel=-1;R.gearSl=-1;renderPor()});$('porClose').onclick=()=>$('por').classList.remove('on');
$('bTow').onclick=open('tow',()=>{R.twRes=null;renderTow()});$('towClose').onclick=()=>$('tow').classList.remove('on');
$('tPas').onclick=open('pas',renderPas);$('pasClose').onclick=()=>$('pas').classList.remove('on');
$('bInv').onclick=open('inv',renderInv);$('invClose').onclick=()=>$('inv').classList.remove('on');
// Ridisegno dei pannelli aperti (dal ciclo dell'interfaccia)
function metaUi(){if($('por').classList.contains('on'))renderPor();if($('tow').classList.contains('on')&&!R.twRes)renderTow();if($('pas').classList.contains('on'))renderPas();if($('inv').classList.contains('on'))renderInv()}
function metaLang(){$('porT').textContent=tr('porT');$('towT').textContent=tr('twT');$('pasT').textContent=tr('psT');$('invT').textContent=tr('ivT');
 ['porClose','towClose','pasClose','invClose'].forEach(id=>$(id).textContent=tr('close'));$('bTow').innerHTML=tr('bTow')+'<i class="dot"></i>';$('bInv').innerHTML=tr('bInv')+'<i class="dot"></i>'}
export {ci,grantMsg,reveal,renderPor,renderTow,renderPas,renderInv,albHtml,albClick,metaUi,metaLang,nm,skTxt,stars,gearTxt};

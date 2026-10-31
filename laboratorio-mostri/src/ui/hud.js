import {aSync,actx,sfx} from '../audio.js';
import {$} from '../core/dom.js';
import {R,S,setS} from '../core/state.js';
import {fmt} from '../core/util.js';
import {E} from '../data/config.js';
import {tr} from '../data/text.js';
import {give,rBase,offAutoInt,AE_COST,LAB_UP,DISC_UP,offRate,AM_COST,amInt,amMax,essMult,pgN,PK,PKR,UP,eggInt,inc,pgain,pkrCost,prestigeState,prRatio,prWorth,spCost,pkCan} from '../game/economy.js';
import {save} from '../save.js';
import {inter} from './ads.js';
import {drawB,startFight} from './battle.js';
import {UB,ub,critC,critD,regen} from '../game/combat.js';
import {colNew,renderCol} from './collection.js';
import {onTab,pickTab,setT,tabs,toast} from './common.js';
import {draw} from './lab.js';
import {dailyInfo,misNew,prog,renderDaily,renderMis} from './missions.js';
import {renderSet} from './settings.js';
import {renderStats} from './stats.js';
import {renderTree} from './tree.js';
import {renderTr} from './trophies.js';
import {openLb} from './leaderboard.js';
import {tutNext} from './tutorial.js';
import {renderGoal} from './goal.js';
import {drawTimers,openIntro} from './timers.js';
import {track} from '../analytics.js';
import {metaLang,metaUi} from './meta.js';
import * as Mt from '../game/meta.js';
import * as Ul from '../game/unlocks.js';
import {banner,bannerMain,bannerMenu,lbList} from '../platform.js';
import {offerCheck} from './shop.js';

// ---- Sblocchi a obiettivi (game/unlocks.js): all'inizio c'è solo il laboratorio, il resto si apre raggiungendo dei traguardi.
// Ogni sblocco ha una finestra «Nuova funzione!»; le schede ancora chiuse restano visibili con il lucchetto e dicono cosa serve.
const UIC={day:['tDaily','tMis'],col:['tCol'],tr:['tTr'],lb:['tLb'],exp:['tExp'],por:['tPor'],pas:['tPas'],ads:['adr'],fm:['fmr'],bat:['stg'],pr:['pr']};
const NAVK={1:'bat',2:'ups'},UPI=['🧪','🏷️','😴','⏱️','➕','🐣','🆙','🌙'];
const rqTxt=r=>r.m?tr('rq_m').replace('{n}',r.m+' '+E[r.m-1]):r.s?tr('rq_s').replace('{n}',r.s):r.c?tr('rq_c').replace('{n}',fmt(r.c)):tr('rq_p');
const ulName=k=>k[0]==='u'&&k.length===2?tr(k):tr('ul_'+k);
function gate(){R.lbOk=lbList();Ul.ulMigrate();const tut=S.tut>=3,on=k=>tut&&Ul.has(k);
 for(const u of Ul.ulCheck()){if(u.up!==undefined)toast(tr('ulNew').replace('{n}',tr('u'+u.up)),1);else R.ulq.push(u.k)}
 if(R.ulq.length&&!R.ulT&&!$('ulp').classList.contains('on'))R.ulT=setTimeout(openUl,900); // dopo la scheda del mostro nuovo
 // Evocazione oscura: si può fare quando si vuole; dopo 5 minuti di gioco, se non è ancora stata fatta, un solo avviso (la prima volta)
 if(tut&&!S.prTip&&!S.ach.pr&&Ul.has('pr')&&(S.pt||0)>=300&&pgain()>=1&&!R.ulq.length&&!$('ulp').classList.contains('on')){S.prTip=1;save();
  setT('ulpB','<div class="ulc"><i>🔮</i><b>'+tr('prTipT')+'</b><p>'+tr('prTipD').replace('{n}',pgain())+'</p><button class="b g" data-a="go" data-k="pr">'+tr('ulGo')+'</button></div>');$('ulp').classList.add('on');sfx('new')}
 for(const k in UIC)for(const id of UIC[k])$(id).style.display=on(k)&&(k!=='lb'||R.lbOk)?'':'none';
 const shop=tut&&Ul.has('ups');$('tShop').style.display=shop?'':'none'; // negozio sempre visibile dopo lo sblocco dei Potenziamenti
 $('tools').style.display=shop||['day','col','tr','lb','exp','por','pas'].some(on)?'':'none';$('nav').style.display=tut?'':'none';
 for(const i in NAVK)$('n'+i).classList.toggle('lk',!on(NAVK[i]));
 UP.forEach((u,i)=>{$('u'+i).style.display=Ul.upOpen(i)&&(!u.am||S.am)&&(!u.ae||S.ae)?'':'none'});$('amB').style.display=S.am?'none':'';
 $('aeB').style.display=!S.ae&&Ul.upOpen(UP.findIndex(u=>u.ae))?'':'none'; // Incubatrice automatica: prima si sblocca con le Essenze
 const nl=Ul.UPL.findIndex((r,i)=>r&&!Ul.upOpen(i));$('uLk').style.display=nl<0?'none':'';
 if(nl>=0)setT('uLk','<i>🔒</i><span><b>'+tr('u'+nl)+'</b><small>'+rqTxt(Ul.UPL[nl])+'</small></span>');
 const ivc=Mt.ch().iv,inv=on('inv')&&(Mt.ivOn()||(ivc.pts>0&&!ivc.cl&&Mt.ivEnded()));$('bInv').style.display=inv?'':'none';$('bTow').style.display=on('tow')?'':'none';
 const tri=on('bat')&&S.wd>=2;$('bTri').style.display=tri?'':'none'; // Prove dei Campioni: dal Mondo 2
 $('mrow').style.display=$('bTow').style.display==='none'&&!inv&&!tri?'none':'';
 $('bTri').classList.toggle('n',tri&&Mt.triPow((Mt.ch().tri.best||0)+1)>=Mt.triNeed((Mt.ch().tri.best||0)+1));
 Mt.twCheck();const c=Mt.ch();$('tPor').classList.toggle('n',Mt.freeLeft()<=0||c.t>=1);$('tPas').classList.toggle('n',Mt.psCan());
 $('bTow').classList.toggle('n',c.tw.tries>0&&!c.tw.run);$('bInv').classList.toggle('n',Mt.ivEnded()&&ivc.pts>0&&!ivc.cl)}
// Finestra «Nuova funzione sbloccata!»: una alla volta, «Andiamo!» porta subito alla funzione
const UGO={lb:openLb,ups:()=>{R.tabGo=0;openUps()},pr:()=>{R.tabGo=2;openUps()},bat:()=>show(1),fm:()=>show(1),tow:()=>show(1),inv:()=>show(1),
 day:()=>$('tDaily').click(),col:()=>$('tCol').click(),tr:()=>$('tTr').click(),por:()=>$('tPor').click(),pas:()=>$('tPas').click(),
 exp:()=>{if(!S.introSeen){S.introSeen=1;openIntro()}else $('tExp').click()}};
// ogni sblocco dà anche un premio: 10 minuti di guadagni e 1 biglietto (consegnati subito)
function openUl(){R.ulT=0;const k=R.ulq.shift();if(!k)return;const u=Ul.UL.find(x=>x.k===k),c=rBase()*2;give(c,0);Mt.addT(1);
 setT('ulpB','<div class="ulc"><small>'+tr('ulT')+'</small><i>'+u.ic+'</i><b>'+ulName(k)+'</b><p>'+tr('uld_'+k)+'</p><div class="ulr">🎁 '+tr('ulRew')+': 🪙 +'+fmt(c)+' · 🎫 +1</div><button class="b g" data-a="go" data-k="'+k+'">'+tr('ulGo')+'</button></div>');
 $('ulp').classList.add('on');sfx('new');track('unlock_'+k)}
$('ulp').onclick=e=>{const b=e.target.closest('[data-a=go]');if(!b&&e.target.id!=='ulp')return;$('ulp').classList.remove('on');
 if(b&&UGO[b.dataset.k])UGO[b.dataset.k]();if(R.ulq.length)R.ulT=setTimeout(openUl,500)};
const xf=v=>v<100?v.toFixed(2):fmt(v);
// Valore attuale accanto alla descrizione dei potenziamenti (così si vede quanto danno)
const mmss=s=>Math.floor(s/60)+':'+String(Math.round(s%60)).padStart(2,'0');
const upNow=(k,l)=>k==='l'?' · ×'+(1+LAB_UP*l).toFixed(2):k==='d'?' · -'+Math.min(99,DISC_UP*l*100).toFixed(1).replace('.0','')+'%':k==='o'?' · '+Math.round(offRate()*100)+'% offline':k==='a'?' · '+amInt().toFixed(1)+'s':k==='f'&&S.ae?' · '+eggInt().toFixed(1)+'s':k==='n'&&l?' · '+mmss(offAutoInt()):'';

function ui(){const b=Date.now()<S.boost;
 {const t=fmt(S.c);$('coins').textContent='🪙 '+t;$('coins').classList.toggle('long',t.length>=6)} // «205.1Qi»: carattere più piccolo, così non viene tagliato
 $('inc').textContent='+'+fmt(inc(),1)+tr('sec')+(b?'  ⚡x2 '+Math.ceil((S.boost-Date.now())/1000)+'s':'');
 $('ess').textContent=S.essT?'🔮 '+fmt(S.ess):'';$('ess').classList.toggle('n',pkCan());$('app').classList.toggle('w2',S.wd===2);$('app').classList.toggle('w3',S.wd>2);
 const sc=spCost();setT('spawn',tr('spawn')+(S.pk.s?' '+E[S.pk.s]:'')+' 🪙 '+fmt(sc));$('spawn').disabled=S.c<sc;
 // Unione automatica: si sblocca per sempre con AM_COST Essenze (poi velocità e livello si potenziano con le monete)
 // Incubatrice automatica: si sblocca per sempre con AE_COST Essenze, poi i livelli (-0,5s ciascuno) si comprano con le monete
 if(!S.ae){setT('aeB',`<i>🐣</i><span><b>${tr('aeT')}</b><small>${tr('aeD')}</small></span><strong>🔮 ${AE_COST}</strong>`);$('aeB').disabled=S.ess<AE_COST}
 if(!S.am){setT('amB',`<i>🔄</i><span><b>${tr('amT')}</b><small>${tr('amD')}</small></span><strong>🔮 ${AM_COST}</strong>`);$('amB').disabled=S.ess<AM_COST}
 {const l=Math.ceil((S.amAd-Date.now())/1000);$('a3').style.display=S.am?'none':'';setT('a3',l>0?'🔄 '+Math.floor(l/60)+':'+String(l%60).padStart(2,'0'):tr('a3'))}
 const ma=S.am,cdl=Math.ceil((R.mallT-Date.now())/1000);$('mall').style.display=ma?'block':'none';setT('mall',tr('mall')+(cdl>0?' '+cdl+'s':''));$('mall').disabled=cdl>0;
 UP.forEach((u,i)=>{const l=S.up[u.k],m=l>=u.max,q=bulk(u.cost,l,u.max);
 setT('u'+i,`<i>${UPI[i]}</i><span><b>${tr('u'+i)} <em>${tr('lvl')} ${l}</em></b><small>${tr('u'+i+'d')}${upNow(u.k,l)}${u.k==='m'?' · ≤ '+tr('lvl')+' '+amMax():''}</small></span><strong>${m?tr('max'):bTxt(q)}</strong>`);$('u'+i).disabled=m||!q.ok});
 const pg=pgain();setT('pr',`<b>${tr('pr')}</b><br><small>${tr('prd')}</small><br>${pg>0?tr('get')+' 🔮 '+pg+'<br><small>'+tr('prPrev').replace('{a}',xf(essMult(S.essT+pg))).replace('{b}',xf(essMult(S.essT)))+'</small><br><small>'+(prWorth()?tr('prOk').replace('{n}',prRatio().toFixed(2)):tr('prWait').replace('{n}',Math.round((prRatio()-1)*100)))+'</small>':tr('need')+' ('+fmt(S.run)+'/'+fmt(pgN())+')'}`);$('pr').disabled=pg<1;
 const di=dailyInfo();$('tDaily').classList.toggle('n',di.can);$('tMis').classList.toggle('n',misNew());
 $('tCol').classList.toggle('n',colNew());
 if($('daily').classList.contains('on'))renderDaily();if($('mis').classList.contains('on'))renderMis();if($('col').classList.contains('on'))renderCol();
 if($('trop').classList.contains('on'))renderTr();if($('ups').classList.contains('on')&&upTab===2)renderTree();if($('ups').classList.contains('on')&&upTab===1)renderUb();
 if($('set').classList.contains('on'))renderSet();if($('stat').classList.contains('on'))renderStats();
 if($('ups').classList.contains('on'))upsTabs();
 $('tMute').textContent=S.sfxOn||S.musOn?'🔊':'🔇';
 drawTimers();drawB();renderGoal();gate();metaUi();offerCheck();
 banner(!!document.querySelector('#ups.on,.ov.on:not(#ulp):not(#pull):not(#wb):not(#intro)'));// banner a striscia (stesse regole di playgama-bridge-config.json): fuori da queste condizioni sta nell'angolo e non serve spazio
 {const W=innerWidth,H=innerHeight,por=H>W,ap=$('app');ap.style.setProperty('--bh',(por?(bannerMenu()?10:8):12)+'vh');
  ap.classList.toggle('bnm',bannerMenu()&&(por||!(W>=1300&&H>=640)));ap.classList.toggle('bns',bannerMain()&&(por||!(W/H>=1.25&&H>=640)))}}
// Testo «🎁 Missioni» → icona sopra ed etichetta sotto (pulsanti in alto e barra di navigazione)
const lbl=(id,t)=>{$(id).querySelector('span').textContent=String(t).replace(/^\S+\s/,'')};
function applyLang(){document.documentElement.lang=R.lang;document.title=tr('gameT');$('a1').textContent=tr('a1');$('a2').textContent=tr('a2');lbl('n0',tr('n0'));lbl('n1',tr('n1'));lbl('n2',tr('n2'));
 lbl('tPor',tr('lb_por'));lbl('tShop',tr('lb_shop'));$('shopT').textContent='🛒 '+tr('shopT');$('shopClose').textContent=tr('close');lbl('tPas',tr('lb_pas'));lbl('tExp',tr('lb_exp'));$('upsT').textContent=tr('ups');$('closeUps').textContent=tr('close');
 $('sqT').textContent=tr('sqT');$('sqClose').textContent=tr('close');lbl('tTr',tr('trb'));lbl('tLb',tr('lbb'));$('lbH').textContent=tr('lbT');$('lbClose').textContent=tr('close');$('trT').textContent=tr('trT');$('trClose').textContent=tr('close');
 lbl('tDaily',tr('dly'));lbl('tMis',tr('lb_mis'));$('misT').textContent='📋 '+tr('misT');$('misClose').textContent=tr('close');lbl('tCol',tr('colb'));$('dT').textContent=tr('dT');$('cT').textContent=tr('colT');$('dClose').textContent=tr('close');$('cClose').textContent=tr('close');
 $('tmT').textContent=tr('introT');$('tmClose').textContent=tr('close');$('tExp').title=tr('expT');
 $('setT').textContent=tr('setT');$('setClose').textContent=tr('close');$('statT').textContent=tr('statT');$('statClose').textContent=tr('close');metaLang()}
// Acquisto a blocchi: ×1, ×10, ×100 o Max (quanti livelli bastano le monete). Vale per i potenziamenti a monete (Laboratorio e Battaglia).
const BULK=[1,10,100,0];let bulkM=1;
function bulk(cost,l,max){let n=0,tot=0;
 if(bulkM){n=Math.min(bulkM,max-l);for(let k=0;k<n;k++)tot+=cost(l+k)}
 else{while(l+n<max&&n<1e5){const c=cost(l+n);if(tot+c>S.c)break;tot+=c;n++}if(!n&&l<max){n=1;tot=cost(l)}}
 return{n,tot,ok:n>0&&S.c>=tot}}
const bTxt=q=>(q.n>1?'×'+fmt(q.n)+' ':'')+'🪙 '+fmt(q.tot);
const bulkTabs=()=>tabs('bulkB',BULK.map(v=>v?'×'+v:tr('buyMax')),BULK.indexOf(bulkM));
onTab('bulkB',k=>{bulkM=BULK[k];sfx('tap');bulkTabs();ui()});
UP.forEach((u,i)=>$('u'+i).onclick=()=>{const l=S.up[u.k],q=bulk(u.cost,l,u.max);if(l>=u.max||!q.ok)return;S.c-=q.tot;S.up[u.k]=l+q.n;prog('upg',q.n);sfx('claim');if(u.k==='c')draw();save();ui()});
$('aeB').onclick=()=>{if(S.ae||S.ess<AE_COST)return;S.ess-=AE_COST;S.ae=1;R.eggT=0;sfx('new');toast('🐣 '+tr('aeOn'),1);track('autoegg');save(true);ui()};
$('amB').onclick=()=>{if(S.am||S.ess<AM_COST)return;S.ess-=AM_COST;S.am=1;R.autoT=0;sfx('new');toast('🔄 '+tr('amOn'),1);track('automerge');save(true);ui()};
$('pr').onclick=()=>{const p=pgain();if(p<1)return;setS(prestigeState(S,p));prog('pr',1);track('prestige',{n:S.ach.pr,p});R.sel=-1;R.pB=0;R.pC=0;startFight();save(true);draw();ui();toast('🔮 +'+p);sfx('win');$('ups').classList.remove('on');inter('prestige')};
// Potenziamenti in tre schede: Laboratorio (monete, unione e incubatrice automatiche), Battaglia (monete: attacco, vita, bottino,
// critici, rigenerazione) ed Essenze (albero delle Essenze ed Evocazione oscura). Battaglia ed Essenze compaiono quando servono.
// upTab = id della scheda (0, 1, 2); la barra mostra solo quelle disponibili. Il CSS nasconde il resto con #ups[data-t].
let upTab=0;
const upAvail=()=>[0,...(Ul.has('bat')?[1]:[]),...(S.essT>0||Ul.has('pr')?[2]:[])];
const ubCan=()=>Ul.has('bat')&&UB.some(u=>ub(u.k)<u.max&&S.c>=u.cost(ub(u.k)));
const upDots=()=>[UP.some(u=>S.up[u.k]<u.max&&S.c>=u.cost(S.up[u.k])&&$('u'+UP.indexOf(u)).style.display!=='none')||(!S.am&&S.ess>=AM_COST)||(!S.ae&&S.ess>=AE_COST&&$('aeB').style.display!=='none'),
 ubCan(),pgain()>=1||pkCan()];
function upsTabs(){bulkTabs();const av=upAvail();if(!av.includes(upTab))upTab=0;$('upsTabs').style.display=av.length>1?'':'none';$('ups').dataset.t=upTab;
 const d=upDots();if(av.length>1)tabs('upsTabs',av.map(k=>'<b>'+['🧪','⚔️','🔮'][k]+'</b><small>'+tr(['tbLab','tbBat','tbEss'][k])+'</small>'),av.indexOf(upTab),av.map(k=>d[k]));
 if(upTab===1)renderUb();if(upTab===2)renderTree()}
function openUps(){const av=upAvail();if(R.tabGo!==undefined){upTab=av.includes(R.tabGo)?R.tabGo:0;R.tabGo=undefined}else{const d=upDots();upTab=av[pickTab(Math.max(0,av.indexOf(upTab)),av.map(k=>d[k]))]}upsTabs();$('ups').classList.add('on')}
onTab('upsTabs',k=>{upTab=upAvail()[k]??0;sfx('tap');upsTabs()});
// Scheda Battaglia: valore attuale accanto a ogni potenziamento
const ubNow=k=>{const l=ub(k);return k==='a'||k==='h'||k==='g'?'+'+10*l+'%':k==='c'?(critC()*100).toFixed(1).replace('.0','')+'%':k==='d'?fmt(critD()*100)+'%':'+'+fmt(regen())+' ❤️/s'};
function renderUb(){setT('upsBat',UB.map(u=>{const l=ub(u.k),m=l>=u.max,q=bulk(u.cost,l,u.max);return '<button class="b" data-k="'+u.k+'"'+(m||!q.ok?' disabled':'')+'><i>'+u.ic+'</i><span><b>'+tr('ub_'+u.k)+' <em>'+tr('lvl')+' '+l+'</em></b><small>'+tr('ub_'+u.k+'d')+' · '+ubNow(u.k)+'</small></span><strong>'+(m?tr('max'):bTxt(q))+'</strong></button>'}).join(''))}
$('upsBat').onclick=e=>{const b=e.target.closest('[data-k]');if(!b||b.disabled)return;const u=UB.find(x=>x.k===b.dataset.k);if(!u)return;const l=ub(u.k),q=bulk(u.cost,l,u.max);if(l>=u.max||!q.ok)return;
 S.c-=q.tot;S.ub[u.k]=l+q.n;prog('upg',q.n);sfx('claim');track('ub_'+u.k);save();renderUb();ui()};
function show(v){['labV','batV'].forEach((id,i)=>{$(id).classList.toggle('on',i===v);$('n'+i).classList.toggle('on',i===v)});if(v===1){tutNext(3);track('first_battle')}ui()}
// Scheda ancora chiusa: dice cosa serve per aprirla
const navGo=(i,f)=>()=>{const k=NAVK[i];if(k&&!Ul.has(k)){sfx('err');toast('🔒 '+ulName(k)+' · '+rqTxt(Ul.UL.find(u=>u.k===k)),1);return}f()};
// Muto rapido (richiesto dalle piattaforme): spegne o riaccende insieme effetti e musica
$('tMute').onclick=()=>{const on=!(S.sfxOn||S.musOn);S.sfxOn=S.musOn=on?1:0;actx();aSync();save();ui()};
$('n0').onclick=()=>show(0);$('n1').onclick=navGo(1,()=>show(1));$('n2').onclick=navGo(2,openUps);
$('closeUps').onclick=()=>$('ups').classList.remove('on');
export {ui,applyLang,show,rqTxt,ulName};

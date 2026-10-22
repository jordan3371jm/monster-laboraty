import {aSync,actx,sfx} from '../audio.js';
import {$} from '../core/dom.js';
import {R,S,setS} from '../core/state.js';
import {fmt} from '../core/util.js';
import {E} from '../data/config.js';
import {tr} from '../data/text.js';
import {give,rBase,AM_COST,amInt,amMax,essMult,pgN,PK,PKR,UP,eggInt,inc,pgain,pkrCost,prestigeState,spCost} from '../game/economy.js';
import {save} from '../save.js';
import {inter} from './ads.js';
import {drawB,startFight} from './battle.js';
import {renderCol,rowOk} from './collection.js';
import {setT,toast} from './common.js';
import {draw} from './lab.js';
import {dailyInfo,prog,renderDaily} from './missions.js';
import {renderSet} from './settings.js';
import {renderStats} from './stats.js';
import {renderTree} from './tree.js';
import {renderTr} from './trophies.js';
import {tutNext} from './tutorial.js';
import {renderGoal} from './goal.js';
import {drawTimers,openIntro} from './timers.js';
import {track} from '../analytics.js';
import {metaLang,metaUi} from './meta.js';
import * as Mt from '../game/meta.js';
import * as Ul from '../game/unlocks.js';
import {banner,bannerMenu} from '../platform.js';
import {offerCheck} from './shop.js';

// ---- Sblocchi a obiettivi (game/unlocks.js): all'inizio c'è solo il laboratorio, il resto si apre raggiungendo dei traguardi.
// Ogni sblocco ha una finestra «Nuova funzione!»; le schede ancora chiuse restano visibili con il lucchetto e dicono cosa serve.
const UIC={day:['tDaily'],col:['tCol'],tr:['tTr'],exp:['tExp'],por:['tPor'],pas:['tPas'],ads:['adr'],fm:['fmr'],bat:['stg'],pr:['pr']};
const NAVK={1:'bat',2:'ups'},UPI=['🧪','🏷️','😴','⏱️','➕','🐣','🆙'];
const rqTxt=r=>r.m?tr('rq_m').replace('{n}',r.m+' '+E[r.m-1]):r.s?tr('rq_s').replace('{n}',r.s):r.c?tr('rq_c').replace('{n}',fmt(r.c)):tr('rq_p');
const ulName=k=>k[0]==='u'&&k.length===2?tr(k):tr('ul_'+k);
function gate(){Ul.ulMigrate();const tut=S.tut>=3,on=k=>tut&&Ul.has(k);
 for(const u of Ul.ulCheck()){if(u.up!==undefined)toast(tr('ulNew').replace('{n}',tr('u'+u.up)),1);else R.ulq.push(u.k)}
 if(R.ulq.length&&!R.ulT&&!$('ulp').classList.contains('on'))R.ulT=setTimeout(openUl,900); // dopo la scheda del mostro nuovo
 for(const k in UIC)for(const id of UIC[k])$(id).style.display=on(k)?'':'none';
 const shop=tut&&Ul.has('ups');$('tShop').style.display=shop?'':'none'; // negozio sempre visibile dopo lo sblocco dei Potenziamenti
 $('tools').style.display=shop||['day','col','tr','exp','por','pas'].some(on)?'':'none';$('nav').style.display=tut?'':'none';
 for(const i in NAVK)$('n'+i).classList.toggle('lk',!on(NAVK[i]));
 UP.forEach((u,i)=>{$('u'+i).style.display=Ul.upOpen(i)&&(!u.am||S.am)?'':'none'});$('amB').style.display=S.am?'none':'';
 const nl=Ul.UPL.findIndex((r,i)=>r&&!Ul.upOpen(i));$('uLk').style.display=nl<0?'none':'';
 if(nl>=0)setT('uLk','<i>🔒</i><span><b>'+tr('u'+nl)+'</b><small>'+rqTxt(Ul.UPL[nl])+'</small></span>');
 $('treeB').style.display=S.essT>0?'':'none';
 const ivc=Mt.ch().iv,inv=on('inv')&&(Mt.ivOn()||(ivc.pts>0&&!ivc.cl&&Mt.ivEnded()));$('bInv').style.display=inv?'':'none';$('bTow').style.display=on('tow')?'':'none';
 $('mrow').style.display=$('bTow').style.display==='none'&&!inv?'none':'';
 Mt.twCheck();const c=Mt.ch();$('tPor').classList.toggle('n',Mt.freeLeft()<=0||c.t>=1);$('tPas').classList.toggle('n',Mt.psCan());
 $('bTow').classList.toggle('n',c.tw.tries>0&&!c.tw.run);$('bInv').classList.toggle('n',Mt.ivEnded()&&ivc.pts>0&&!ivc.cl)}
// Finestra «Nuova funzione sbloccata!»: una alla volta, «Andiamo!» porta subito alla funzione
const UGO={ups:()=>$('ups').classList.add('on'),pr:()=>$('ups').classList.add('on'),bat:()=>show(1),fm:()=>show(1),tow:()=>show(1),inv:()=>show(1),
 day:()=>$('tDaily').click(),col:()=>$('tCol').click(),tr:()=>$('tTr').click(),por:()=>$('tPor').click(),pas:()=>$('tPas').click(),
 exp:()=>{if(!S.introSeen){S.introSeen=1;openIntro()}else $('tExp').click()}};
// ogni sblocco dà anche un premio: 10 minuti di guadagni e 1 biglietto (consegnati subito)
function openUl(){R.ulT=0;const k=R.ulq.shift();if(!k)return;const u=Ul.UL.find(x=>x.k===k),c=rBase()*2;give(c,0);Mt.addT(1);
 setT('ulpB','<div class="ulc"><small>'+tr('ulT')+'</small><i>'+u.ic+'</i><b>'+ulName(k)+'</b><p>'+tr('uld_'+k)+'</p><div class="ulr">🎁 '+tr('ulRew')+': 🪙 +'+fmt(c)+' · 🎫 +1</div><button class="b g" data-a="go" data-k="'+k+'">'+tr('ulGo')+'</button></div>');
 $('ulp').classList.add('on');sfx('new');track('unlock_'+k)}
$('ulp').onclick=e=>{const b=e.target.closest('[data-a=go]');if(!b&&e.target.id!=='ulp')return;$('ulp').classList.remove('on');
 if(b&&UGO[b.dataset.k])UGO[b.dataset.k]();if(R.ulq.length)R.ulT=setTimeout(openUl,500)};
const xf=v=>v<100?v.toFixed(2):fmt(v);

function ui(){const b=Date.now()<S.boost;
 $('coins').textContent='🪙 '+fmt(S.c);
 $('inc').textContent='+'+fmt(inc(),1)+tr('sec')+(b?'  ⚡x2 '+Math.ceil((S.boost-Date.now())/1000)+'s':'');
 $('ess').textContent=S.essT?'🔮 '+S.ess:'';$('ess').classList.toggle('n',PK.some(p=>S.pk[p.k]<p.max&&S.ess>=p.cost[S.pk[p.k]])||PKR.some(p=>(S.pk[p.k]||0)<p.max&&S.ess>=pkrCost(S.pk[p.k]||0)));$('app').classList.toggle('w2',S.wd===2);$('app').classList.toggle('w3',S.wd>2);
 const sc=spCost();setT('spawn',tr('spawn')+(S.pk.s?' '+E[S.pk.s]:'')+' 🪙 '+fmt(sc));$('spawn').disabled=S.c<sc;
 // Unione automatica: si sblocca per sempre con AM_COST Essenze (poi velocità e livello si potenziano con le monete)
 if(!S.am){setT('amB',`<i>🔄</i><span><b>${tr('amT')}</b><small>${tr('amD')}</small></span><strong>🔮 ${AM_COST}</strong>`);$('amB').disabled=S.ess<AM_COST}
 {const l=Math.ceil((S.amAd-Date.now())/1000);$('a3').style.display=S.am?'none':'';setT('a3',l>0?'🔄 '+Math.floor(l/60)+':'+String(l%60).padStart(2,'0'):tr('a3'))}
 const ma=S.am,cdl=Math.ceil((R.mallT-Date.now())/1000);$('mall').style.display=ma?'block':'none';setT('mall',tr('mall')+(cdl>0?' '+cdl+'s':''));$('mall').disabled=cdl>0;
 UP.forEach((u,i)=>{const l=S.up[u.k],m=l>=u.max,c=u.cost(l);
  setT('u'+i,`<i>${UPI[i]}</i><span><b>${tr('u'+i)} <em>${tr('lvl')} ${l}</em></b><small>${tr('u'+i+'d')}${u.k==='f'&&l?' · '+Math.round(eggInt())+'s':''}${u.k==='a'?' · '+amInt()+'s':''}${u.k==='m'?' · ≤ '+tr('lvl')+' '+amMax():''}</small></span><strong>${m?tr('max'):'🪙 '+fmt(c)}</strong>`);$('u'+i).disabled=m||S.c<c});
 const pg=pgain();setT('pr',`<b>${tr('pr')}</b><br><small>${tr('prd')}</small><br>${pg>0?tr('get')+' 🔮 '+pg+'<br><small>'+tr('prPrev').replace('{a}',xf(essMult(S.essT+pg))).replace('{b}',xf(essMult(S.essT)))+'</small>':tr('need')+' ('+fmt(S.run)+'/'+fmt(pgN())+')'}`);$('pr').disabled=pg<1;
 const di=dailyInfo();$('tDaily').classList.toggle('n',di.can||S.dl.m.some(m=>m.p>=m.n&&!m.c)||(S.dl.w&&S.dl.w.p>=S.dl.w.n&&!S.dl.w.c));
 $('tCol').classList.toggle('n',[0,1,2,3,4,5,6,7].some(r=>rowOk(r)&&!S.col[r]));
 if($('daily').classList.contains('on'))renderDaily();if($('col').classList.contains('on'))renderCol();
 if($('trop').classList.contains('on'))renderTr();if($('tree').classList.contains('on'))renderTree();
 if($('set').classList.contains('on'))renderSet();if($('stat').classList.contains('on'))renderStats();
 $('tMute').textContent=S.sfxOn||S.musOn?'🔊':'🔇';
 drawTimers();drawB();renderGoal();gate();metaUi();offerCheck();
 banner(!!document.querySelector('#ups.on,.ov.on:not(#ulp):not(#pull):not(#wb):not(#intro)'));$('app').classList.toggle('bnm',bannerMenu()&&innerHeight>innerWidth)}
// Testo «🎁 Missioni» → icona sopra ed etichetta sotto (pulsanti in alto e barra di navigazione)
const lbl=(id,t)=>{$(id).querySelector('span').textContent=String(t).replace(/^\S+\s/,'')};
function applyLang(){document.documentElement.lang=R.lang;document.title=tr('gameT');$('a1').textContent=tr('a1');$('a2').textContent=tr('a2');lbl('n0',tr('n0'));lbl('n1',tr('n1'));lbl('n2',tr('n2'));
 lbl('tPor',tr('lb_por'));lbl('tShop',tr('lb_shop'));$('shopT').textContent='🛒 '+tr('shopT');$('shopClose').textContent=tr('close');lbl('tPas',tr('lb_pas'));lbl('tExp',tr('lb_exp'));$('upsT').textContent=tr('ups');$('closeUps').textContent=tr('close');
 $('sqT').textContent=tr('sqT');$('sqClose').textContent=tr('close');lbl('tTr',tr('trb'));$('trT').textContent=tr('trT');$('trClose').textContent=tr('close');$('tT').textContent=tr('treeT');$('tClose').textContent=tr('close');$('treeB').textContent=tr('treeB');
 lbl('tDaily',tr('dly'));lbl('tCol',tr('colb'));$('dT').textContent=tr('dT');$('cT').textContent=tr('colT');$('dClose').textContent=tr('close');$('cClose').textContent=tr('close');
 $('tmT').textContent=tr('introT');$('tmClose').textContent=tr('close');$('tExp').title=tr('expT');
 $('setT').textContent=tr('setT');$('setClose').textContent=tr('close');$('statT').textContent=tr('statT');$('statClose').textContent=tr('close');metaLang()}
UP.forEach((u,i)=>$('u'+i).onclick=()=>{const l=S.up[u.k],c=u.cost(l);if(l>=u.max||S.c<c)return;S.c-=c;S.up[u.k]++;prog('upg',1);sfx('claim');if(u.k==='c')draw();save();ui()});
$('amB').onclick=()=>{if(S.am||S.ess<AM_COST)return;S.ess-=AM_COST;S.am=1;R.autoT=0;sfx('new');toast('🔄 '+tr('amOn'),1);track('automerge');save(true);ui()};
$('pr').onclick=()=>{const p=pgain();if(p<1)return;setS(prestigeState(S,p));track('prestige',{n:S.ach.pr,p});R.sel=-1;R.pB=0;R.pC=0;startFight();save(true);draw();ui();toast('🔮 +'+p);sfx('win');$('ups').classList.remove('on');inter('prestige')};
function show(v){['labV','batV'].forEach((id,i)=>{$(id).classList.toggle('on',i===v);$('n'+i).classList.toggle('on',i===v)});if(v===1){tutNext(3);track('first_battle')}ui()}
// Scheda ancora chiusa: dice cosa serve per aprirla
const navGo=(i,f)=>()=>{const k=NAVK[i];if(k&&!Ul.has(k)){sfx('err');toast('🔒 '+ulName(k)+' · '+rqTxt(Ul.UL.find(u=>u.k===k)),1);return}f()};
// Muto rapido (richiesto dalle piattaforme): spegne o riaccende insieme effetti e musica
$('tMute').onclick=()=>{const on=!(S.sfxOn||S.musOn);S.sfxOn=S.musOn=on?1:0;actx();aSync();save();ui()};
$('n0').onclick=()=>show(0);$('n1').onclick=navGo(1,()=>show(1));$('n2').onclick=navGo(2,()=>$('ups').classList.add('on'));
$('closeUps').onclick=()=>$('ups').classList.remove('on');
export {ui,applyLang,show,rqTxt,ulName};

import {sfx} from '../audio.js';
import {$} from '../core/dom.js';
import {R,S,setS} from '../core/state.js';
import {fmt} from '../core/util.js';
import {E} from '../data/config.js';
import {tr} from '../data/text.js';
import {PG,PK,PKR,UP,eggInt,inc,pgain,pkrCost,prestigeState,spCost} from '../game/economy.js';
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
import {drawTimers} from './timers.js';
import {track} from '../analytics.js';

function ui(){const b=Date.now()<S.boost;
 $('coins').textContent='🪙 '+fmt(S.c);
 $('inc').textContent='+'+fmt(inc(),1)+tr('sec')+(b?'  ⚡x2 '+Math.ceil((S.boost-Date.now())/1000)+'s':'');
 $('ess').textContent=S.essT?'🔮 '+S.ess:'';$('ess').classList.toggle('n',PK.some(p=>S.pk[p.k]<p.max&&S.ess>=p.cost[S.pk[p.k]])||PKR.some(p=>(S.pk[p.k]||0)<p.max&&S.ess>=pkrCost(S.pk[p.k]||0)));$('app').classList.toggle('w2',S.wd>1);
 const sc=spCost();setT('spawn',tr('spawn')+(S.pk.s?' '+E[S.pk.s]:'')+' 🪙 '+fmt(sc));$('spawn').disabled=S.c<sc;
 const ma=S.up.a>=1,cdl=Math.ceil((R.mallT-Date.now())/1000);$('mall').style.display=ma?'block':'none';setT('mall',tr('mall')+(cdl>0?' '+cdl+'s':''));$('mall').disabled=cdl>0;
 UP.forEach((u,i)=>{const l=S.up[u.k],m=l>=u.max,c=u.cost(l);
  setT('u'+i,`<b>${tr('u'+i)}</b> · ${tr('lvl')} ${l}<br><small>${tr('u'+i+'d')}${u.k==='f'&&l?' · '+Math.round(eggInt())+'s':''}</small><br>${m?tr('max'):'🪙 '+fmt(c)}`);$('u'+i).disabled=m||S.c<c});
 const pg=pgain();setT('pr',`<b>${tr('pr')}</b><br><small>${tr('prd')}</small><br>${pg>0?tr('get')+' 🔮 '+pg:tr('need')+' ('+fmt(S.run)+'/'+fmt(PG)+')'}`);$('pr').disabled=pg<1;
 const di=dailyInfo();$('tDaily').classList.toggle('n',di.can||S.dl.m.some(m=>m.p>=m.n&&!m.c)||(S.dl.w&&S.dl.w.p>=S.dl.w.n&&!S.dl.w.c));
 $('tCol').classList.toggle('n',[0,1,2,3,4,5,6,7].some(r=>rowOk(r)&&!S.col[r]));
 if($('daily').classList.contains('on'))renderDaily();if($('col').classList.contains('on'))renderCol();
 if($('trop').classList.contains('on'))renderTr();if($('tree').classList.contains('on'))renderTree();
 if($('set').classList.contains('on'))renderSet();if($('stat').classList.contains('on'))renderStats();
 drawTimers();drawB();renderGoal()}
function applyLang(){document.documentElement.lang=R.lang;$('a1').textContent=tr('a1');$('a2').textContent=tr('a2');$('n0').textContent=tr('n0');$('n1').textContent=tr('n1');$('n2').textContent=tr('n2');$('upsT').textContent=tr('ups');$('closeUps').textContent=tr('close');
 $('sqT').textContent=tr('sqT');$('sqClose').textContent=tr('close');$('tTr').textContent=tr('trb');$('trT').textContent=tr('trT');$('trClose').textContent=tr('close');$('tT').textContent=tr('treeT');$('tClose').textContent=tr('close');$('treeB').textContent=tr('treeB');
 $('tDaily').firstChild.textContent=tr('dly');$('tCol').firstChild.textContent=tr('colb');$('dT').textContent=tr('dT');$('cT').textContent=tr('colT');$('dClose').textContent=tr('close');$('cClose').textContent=tr('close');
 $('tmT').textContent=tr('introT');$('tmClose').textContent=tr('close');$('tExp').title=tr('expT');
 $('setT').textContent=tr('setT');$('setClose').textContent=tr('close');$('statT').textContent=tr('statT');$('statClose').textContent=tr('close')}
UP.forEach((u,i)=>$('u'+i).onclick=()=>{const l=S.up[u.k],c=u.cost(l);if(l>=u.max||S.c<c)return;S.c-=c;S.up[u.k]++;prog('upg',1);sfx('claim');if(u.k==='c')draw();save();ui()});
$('pr').onclick=()=>{const p=pgain();if(p<1)return;setS(prestigeState(S,p));track('prestige',{n:S.ach.pr,p});R.sel=-1;R.pB=0;R.pC=0;startFight();save(true);draw();ui();toast('🔮 +'+p);sfx('win');$('ups').classList.remove('on');inter('prestige')};
function show(v){['labV','batV'].forEach((id,i)=>{$(id).classList.toggle('on',i===v);$('n'+i).classList.toggle('on',i===v)});if(v===1){tutNext(3);track('first_battle')}ui()}
$('n0').onclick=()=>show(0);$('n1').onclick=()=>show(1);$('n2').onclick=()=>$('ups').classList.add('on');
$('closeUps').onclick=()=>$('ups').classList.remove('on');
export {ui,applyLang,show};

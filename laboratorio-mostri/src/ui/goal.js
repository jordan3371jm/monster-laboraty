import {$} from '../core/dom.js';
import {S} from '../core/state.js';
import {fmt} from '../core/util.js';
import {E,MAXT,NR} from '../data/config.js';
import {tr} from '../data/text.js';
import {PG,PK,PKR,pgain,pkrCost} from '../game/economy.js';
import {rowOk} from './collection.js';
import {setT} from './common.js';
import {dailyInfo} from './missions.js';
import {goal as timersGoal} from '../game/timers.js';

// ---- Barra «prossimo obiettivo»: dice sempre cosa fare adesso (premi da riscuotere, poi mostro nuovo, boss…) ----
function nextGoal(){
 if(dailyInfo().can)return{t:tr('g_daily'),p:1,go:'tDaily'};
 if([...S.dl.m,S.dl.w].some(m=>m&&m.p>=m.n&&!m.c))return{t:tr('g_mis'),p:1,go:'tDaily'};
 const tg=timersGoal();if(tg&&tg.p>=1)return{t:tr(tg.gk),p:1,go:'tExp'}; // spedizione, uovo, ordine o 💠 pronti
 for(let r=0;r<NR;r++)if(rowOk(r)&&!S.col[r])return{t:tr('g_col'),p:1,go:'tCol'};
 if(PK.some(p=>S.pk[p.k]<p.max&&S.ess>=p.cost[S.pk[p.k]])||PKR.some(p=>(S.pk[p.k]||0)<p.max&&S.ess>=pkrCost(S.pk[p.k]||0)))return{t:tr('g_tree'),p:1,go:'treeB'};
 if(!S.ach.pr){const pg=pgain();return{t:pg>=1?tr('g_prA').replace('{n}',pg):tr('g_pr1')+' · '+fmt(S.run)+'/'+fmt(PG),p:Math.min(1,S.run/PG),go:'n2'}}
 const m=Math.max(0,...S.g),u=S.disc.indexOf(0)+1; // primo mostro non ancora scoperto
 if(m>0&&u>=2&&u<=MAXT){const b=u-1,have=S.g.filter(t=>t===b).length;
  return{t:tr('g_mon').replace('{e}',E[u-1]).replace('{l}',b),p:m>=b?Math.min(have,2)/2:m/b/2,go:'n0'}}
 const bs=Math.ceil(S.st/5)*5;return{t:tr('g_boss').replace('{n}',bs),p:Math.min(1,((S.st-1)%5)/4),go:'n1'}}
function renderGoal(){const el=$('goal');if(S.tut<3){el.classList.remove('on');return}
 const g=nextGoal();el.classList.add('on');el.classList.toggle('rdy',g.p>=1);el.dataset.go=g.go;el.firstChild.style.width=Math.round(g.p*100)+'%';setT('goalT','🎯 '+g.t)}
$('goal').onclick=()=>{const g=$('goal').dataset.go;if(g)$(g).click()};
export {nextGoal,renderGoal};

import {$} from '../core/dom.js';
import {R,S} from '../core/state.js';
import {fmt} from '../core/util.js';
import {E,MAXT,NR} from '../data/config.js';
import {tr} from '../data/text.js';
import {AE_COST,AM_COST,pgN,PK,PKR,pgain,pkrCost} from '../game/economy.js';
import {rowOk} from './collection.js';
import {setT} from './common.js';
import {dailyInfo,misNew} from './missions.js';
import {goal as timersGoal} from '../game/timers.js';
import {has,rqP,ulNext} from '../game/unlocks.js';
import {rqTxt,ulName} from './hud.js';

// ---- Barra «prossimo obiettivo»: dice sempre cosa fare adesso (premi da riscuotere, poi mostro nuovo, boss…) ----
// Solo i sistemi già sbloccati possono proporre qualcosa; se non c'è nulla da riscuotere si mostra il prossimo sblocco.
function nextGoal(){
 if(has('day')&&dailyInfo().can)return{t:tr('g_daily'),p:1,go:'tDaily'};
 if(has('day')&&misNew())return{t:tr('g_mis'),p:1,go:'tMis'};
 const tg=has('exp')&&timersGoal();if(tg&&tg.p>=1)return{t:tr(tg.gk),p:1,go:'tExp'}; // spedizione, uovo, ordine o 💠 pronti
 if(has('col'))for(let r=0;r<NR;r++)if(rowOk(r)&&!S.col[r])return{t:tr('g_col'),p:1,go:'tCol'};
 if(PK.some(p=>S.pk[p.k]<p.max&&S.ess>=p.cost[S.pk[p.k]])||PKR.some(p=>(S.pk[p.k]||0)<p.max&&S.ess>=pkrCost(S.pk[p.k]||0)))return{t:tr('g_tree'),p:1,go:'treeB'};
 if(!S.am&&S.ess>=AM_COST&&has('ups'))return{t:tr('g_am'),p:1,go:'n2:0'}; // unione automatica acquistabile
 if(S.am&&!S.ae&&S.ess>=AE_COST&&has('u5'))return{t:tr('g_ae'),p:1,go:'n2:0'}; // poi l'incubatrice automatica
 const pg=pgain();if(has('pr')&&!S.ach.pr&&pg>=1)return{t:tr('g_prA').replace('{n}',pg),p:1,go:'n2:1'};
 const nu=ulNext();if(nu)return{t:ulName(nu.k)+' · '+rqTxt(nu),p:rqP(nu),go:nu.s?'n1':nu.p?'n2':'n0',ul:1};
 if(!S.ach.pr)return{t:tr('g_pr1')+' · '+fmt(S.run)+'/'+fmt(pgN()),p:Math.min(1,S.run/pgN()),go:'n2:1'};
 const m=Math.max(0,...S.g),u=S.disc.indexOf(0)+1; // primo mostro non ancora scoperto
 if(m>0&&u>=2&&u<=MAXT){const b=u-1,have=S.g.filter(t=>t===b).length;
  return{t:tr('g_mon').replace('{e}',E[u-1]).replace('{l}',b),p:m>=b?Math.min(have,2)/2:m/b/2,go:'n0'}}
 const bs=Math.ceil(S.st/5)*5;return{t:tr('g_boss').replace('{n}',bs),p:Math.min(1,((S.st-1)%5)/4),go:'n1'}}
function renderGoal(){const el=$('goal');if(S.tut<3){el.classList.remove('on');return}
 const g=nextGoal();el.classList.add('on');el.classList.toggle('rdy',g.p>=1&&!g.ul);el.classList.toggle('ul',!!g.ul);el.dataset.go=g.go;el.firstChild.style.width=Math.round(g.p*100)+'%';setT('goalT',(g.ul?'🔒 ':'🎯 ')+g.t)}
$('goal').onclick=()=>{const g=$('goal').dataset.go;if(!g)return;const[id,t]=g.split(':');if(t!==undefined)R.tabGo=+t;$(id).click()}; // «id:n» apre la scheda n
export {nextGoal,renderGoal};

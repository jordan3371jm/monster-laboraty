import {sfx} from '../audio.js';
import {$} from '../core/dom.js';
import {fmt} from '../core/util.js';
import {E,MAXT} from '../data/config.js';
import {tr} from '../data/text.js';
import {lbEntries,lbList,lbScore,lbVal,LB_IDS,myId} from '../platform.js';
import {onTab,setT,tabs} from './common.js';

// ---- Classifica (pulsante 🏅): solo dove il Bridge le dà «in_game», cioè Playgama. Una scheda per categoria, 50 posti ciascuna:
// i posti vuoti restano visibili come «posto libero», la propria riga è evidenziata e in cima c'è cosa serve per salire di un posto.
const LB_N=50,LB_IC={best_stage:'⚔️',total_coins:'🪙',best_monster:'👑'},MED=['🥇','🥈','🥉'];
const esc=s=>String(s).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const lbFmt=(id,v)=>id==='best_monster'?(E[v-1]||'')+' n° '+fmt(v):id==='total_coins'?fmt(v)+' 🪙':tr('lbLv').replace('{n}',fmt(v));
const who=e=>esc(String(e.name||tr('lbAnon')).slice(0,24));
const row=(id,pos,e,me)=>'<div class="lbr'+(me?' me':'')+(e?'':' free')+'"><i>'+(pos<=3&&e?MED[pos-1]:pos)+'</i>'+(e?who(e)+(me?' ('+tr('lbYou')+')':''):tr('lbFree'))+(e?'<span>'+lbFmt(id,e.score)+'</span>':'')+'</div>';
let lbTab=0,lbReq=0;
function lbBody(id,list){const me=myId(),mine=list.find(e=>me&&String(e.id)===me),top=list.slice(0,LB_N);
 // la spinta: quanto manca per salire di un posto (o per entrare in classifica)
 const ri=mine?list.indexOf(mine):-1,up=ri>0?list[ri-1]:!mine&&list.length?list[Math.min(LB_N,list.length)-1]:null,my=Math.max(lbVal(id),mine?mine.score:0);
 let h='';
 if(up&&(id!=='best_monster'||up.score<MAXT)){const tx=id==='total_coins'?tr('lbBeat').replace('{n}',lbFmt(id,Math.max(1,up.score-my+1))):tr('lbReach').replace('{n}',lbFmt(id,up.score+1)); // monete: quante ne mancano; livello e mostro: il traguardo da raggiungere
  h+='<div class="cs">🔥 '+tx.replace('{p}',who(up))+'</div>'}
 else if(mine&&ri===0)h+='<div class="cs">👑 '+tr('lbTop')+'</div>';
 else if(!list.length)h+='<div class="cs">'+tr('lbNone')+'</div>';
 if(mine&&top.indexOf(mine)<0)h+='<div class="lbl">'+row(id,mine.rank,mine,1)+'</div>'; // fuori dai 50: la propria posizione resta in cima
 h+='<div class="lbl">';for(let i=0;i<LB_N;i++)h+=row(id,i+1,top[i],top[i]&&top[i]===mine);
 return h+'</div>'}
function renderLb(){const q=++lbReq,id=LB_IDS[lbTab];lbScore(1);$('lbo').scrollTop=0;
 tabs('lbTabs',LB_IDS.map(k=>LB_IC[k]+' '+tr('lbs_'+k)),lbTab);setT('lbB','<div class="cs">'+tr('lb_'+id)+'</div><div class="cs">…</div>');
 // un attimo di attesa: i punteggi appena inviati da lbScore(1) finiscono già nella classifica letta
 setTimeout(()=>lbEntries(id).then(l=>{if(q!==lbReq)return;setT('lbB','<div class="cs"><b>'+LB_IC[id]+' '+tr('lb_'+id)+'</b></div>'+lbBody(id,(Array.isArray(l)?l:[]).slice().sort((a,b)=>a.rank-b.rank)))},
  ()=>{if(q===lbReq)setT('lbB','<div class="cs">'+tr('lbErr')+'</div>')}),400)}
const openLb=()=>{if(!lbList())return;renderLb();$('lbo').classList.add('on')};
onTab('lbTabs',t=>{lbTab=t;sfx('tap');renderLb()});
$('tLb').onclick=openLb;$('lbClose').onclick=()=>$('lbo').classList.remove('on');
export {openLb};

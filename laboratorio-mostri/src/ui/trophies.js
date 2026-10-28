import {sfx} from '../audio.js';
import {$} from '../core/dom.js';
import {R,S} from '../core/state.js';
import {fmt} from '../core/util.js';
import {tr} from '../data/text.js';
import {trN} from '../game/economy.js';
import {save} from '../save.js';
import {E,MAXT} from '../data/config.js';
import {onTab,setT,tabs,toast} from './common.js';
import {achieve,lbEntries,lbList,lbScore,lbVal,LB_IDS,myId} from '../platform.js';

// ---- Trofei (+1% guadagni ciascuno, permanenti) ----
const TRF=[{k:'mg',ic:'🔗',th:[50,250,1000,5000],v:()=>S.ach.mg},{k:'sp',ic:'🥚',th:[100,500,2500,10000],v:()=>S.ach.sp},{k:'st',ic:'⚔️',th:[5,15,30,60],v:()=>S.bs},
 {k:'lt',ic:'🪙',th:[1e4,1e6,1e9,1e12],v:()=>S.lt},{k:'tm',ic:'👑',th:[5,9,13,20,26,33,39],v:()=>S.disc.lastIndexOf(1)+1},{k:'ev',ic:'👻',th:[5,25,100],v:()=>S.ach.ev},
 {k:'pr',ic:'🔮',th:[1,5,15],v:()=>S.ach.pr},{k:'dy',ic:'🔥',th:[3,7,30],v:()=>S.dl.st},{k:'ch',ic:'🎁',th:[1,10,50],v:()=>S.ach.ch}];
const TOT=TRF.reduce((s,f)=>s+f.th.length,0);
function chk(){let n=0,first='';
 TRF.forEach(f=>{const v=f.v();f.th.forEach((x,i)=>{const id=f.k+i;if(!S.tr[id]&&v>=x){S.tr[id]=1;n++;achieve(id);if(!first)first=f.ic+' '+tr('tf_'+f.k).replace('{n}',fmt(x))}})});
 if(n){toast('🏆 '+tr('trNew')+': '+first+(n>1?' (+'+(n-1)+')':'')+' · +'+n+'% '+tr('stb'),1);sfx('new');save()}R.trC=Object.keys(S.tr).length}
function renderTr(){const n=trN();let h='<div class="cs">🏆 <b>'+n+'/'+TOT+'</b> · +'+n+'% '+tr('stb')+'</div>';
 TRF.forEach(f=>{const v=f.v(),i=f.th.findIndex((x,j)=>!S.tr[f.k+j]),done=i<0,x=done?f.th[f.th.length-1]:f.th[i],p=done?1:Math.min(1,v/x);
  h+='<div class="ms'+(done?' ok':'')+'"><div>'+f.ic+' '+tr('tf_'+f.k).replace('{n}',fmt(x))+'<small>'+(done?'✓':fmt(Math.min(v,x))+'/'+fmt(x))+'</small><div class="bar"><i style="width:'+p*100+'%"></i></div>'
  +'<div class="tp">'+f.th.map((_,j)=>'<b'+(S.tr[f.k+j]?' class="on"':'')+'>🏆</b>').join('')+'</div></div></div>'});
 setT('trB',h)}
// ---- Classifiche (solo dove il Bridge le dà «in_game», cioè Playgama): podio dei primi 3, la tua posizione e chi superare ----
const LB_IC={best_stage:'⚔️',total_coins:'🪙',best_monster:'👑'},MED=['🥇','🥈','🥉'];
const esc=s=>String(s).replace(/[&<>"']/g,c=>'&#'+c.charCodeAt(0)+';');
const lbFmt=(id,v)=>id==='best_monster'?(E[v-1]||'')+' n° '+fmt(v):id==='total_coins'?fmt(v)+' 🪙':tr('lbLv').replace('{n}',fmt(v));
const who=e=>esc(String(e.name||tr('lbAnon')).slice(0,24));
let trTab=0,lbReq=0;
function lbBox(id,list){const me=myId(),mine=list.find(e=>me&&String(e.id)===me),top=list.slice(0,3);
 let h='<div class="ms lb"><div><b>'+LB_IC[id]+' '+tr('lb_'+id)+'</b>';
 h+=top.length?top.map((e,i)=>'<div class="lbr'+(e===mine?' me':'')+'">'+MED[i]+' '+who(e)+'<span>'+lbFmt(id,e.score)+'</span></div>').join(''):'<small class="d">'+tr('lbNone')+'</small>';
 if(mine&&top.indexOf(mine)<0)h+='<div class="lbr me">#'+mine.rank+' '+tr('lbYou')+'<span>'+lbFmt(id,mine.score)+'</span></div>';
 // la spinta: quanto manca per salire di un posto (o per entrare sul podio)
 const ri=mine?list.indexOf(mine):-1,up=ri>0?list[ri-1]:!mine&&list.length?list[Math.min(2,list.length-1)]:null;
 const my=Math.max(lbVal(id),mine?mine.score:0);
 if(up&&(id!=='best_monster'||up.score<MAXT)){const tx=id==='total_coins'?tr('lbBeat').replace('{n}',lbFmt(id,Math.max(1,up.score-my+1))):tr('lbReach').replace('{n}',lbFmt(id,up.score+1)); // monete: quante ne mancano; livello e mostro: il traguardo da raggiungere
  h+='<small class="d">🔥 '+tx.replace('{p}',who(up))+'</small>'}
 else if(mine&&ri===0)h+='<small class="d">👑 '+tr('lbTop')+'</small>';
 return h+'</div></div>'}
function renderLb(){const q=++lbReq;lbScore(1);setT('trB','<div class="cs">'+tr('lbD')+'</div>'+LB_IDS.map(id=>'<div id="lb_'+id+'" class="ms lb"><div><b>'+LB_IC[id]+' '+tr('lb_'+id)+'</b><small class="d">…</small></div></div>').join(''));
 // un attimo di attesa: i punteggi appena inviati da lbScore(1) finiscono già nella classifica letta
 setTimeout(()=>LB_IDS.forEach(id=>lbEntries(id).then(l=>{if(q!==lbReq||trTab!==1)return;const el=$('lb_'+id);if(el)el.outerHTML=lbBox(id,(Array.isArray(l)?l:[]).slice().sort((a,b)=>a.rank-b.rank))},
  ()=>{const el=$('lb_'+id);if(q===lbReq&&el)el.querySelector('small').textContent=tr('lbErr')})),600)}
function renderTrop(){const lb=lbList();if(!lb)trTab=0;$('trTabs').style.display=lb?'':'none';
 if(lb)tabs('trTabs',[tr('trb'),tr('lbT')],trTab);trTab?renderLb():renderTr()}
onTab('trTabs',t=>{trTab=t;sfx('tap');renderTrop()});
$('tTr').onclick=()=>{renderTrop();$('trop').classList.add('on')};$('trClose').onclick=()=>$('trop').classList.remove('on');
const refreshTr=()=>{if(!trTab)renderTr()}; // la classifica non si ricarica da sola (ogni lettura è una chiamata di rete)
export {TRF,TOT,chk,renderTr,refreshTr};

import {sfx} from '../audio.js';
import {$} from '../core/dom.js';
import {R,S} from '../core/state.js';
import {fmt} from '../core/util.js';
import {tr} from '../data/text.js';
import {trN} from '../game/economy.js';
import {save} from '../save.js';
import {setT,toast} from './common.js';
import {achieve} from '../platform.js';

// ---- Trofei (+1% guadagni ciascuno, permanenti) ----
const TRF=[{k:'mg',ic:'🔗',th:[50,250,1000,5000],v:()=>S.ach.mg},{k:'sp',ic:'🥚',th:[100,500,2500,10000],v:()=>S.ach.sp},{k:'st',ic:'⚔️',th:[5,15,30,60],v:()=>S.bs},
 {k:'lt',ic:'🪙',th:[1e4,1e6,1e9,1e12],v:()=>S.lt},{k:'tm',ic:'👑',th:[5,9,13,20,26],v:()=>S.disc.lastIndexOf(1)+1},{k:'ev',ic:'👻',th:[5,25,100],v:()=>S.ach.ev},
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
$('tTr').onclick=()=>{renderTr();$('trop').classList.add('on')};$('trClose').onclick=()=>$('trop').classList.remove('on');
export {TRF,TOT,chk,renderTr};

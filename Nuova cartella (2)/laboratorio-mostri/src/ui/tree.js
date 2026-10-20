import {sfx} from '../audio.js';
import {$} from '../core/dom.js';
import {S} from '../core/state.js';
import {tr} from '../data/text.js';
import {PK,PKR,pkrCost} from '../game/economy.js';
import {save} from '../save.js';
import {track} from '../analytics.js';
import {setT} from './common.js';
import {ui} from './hud.js';

// ---- Albero delle Essenze (si spendono le 🔮): radici a livelli finiti + rami infiniti ----
// effetto totale dei rami infiniti, mostrato accanto al livello
const eff=(k,l)=>k==='e'?'-'+Math.round((1-Math.pow(.98,l))*100)+'%':'+'+(k==='x'?4:2)*l+'%';
function renderTree(){let h='<div class="cs">🔮 <b>'+S.ess+'</b><small class="d">'+tr('pkNote')+'</small></div><div class="wh">'+tr('treeR')+'</div>';
 PK.forEach(p=>{const l=S.pk[p.k],m=l>=p.max,c=p.cost[l],ok=!m&&S.ess>=c;
  h+='<div class="ms'+(m?' ok':'')+'"><div>'+p.ic+' <b>'+tr('pk_'+p.k)+'</b> · '+tr('lvl')+' '+l+'/'+p.max+'<small class="d">'+tr('pk_'+p.k+'d')+'</small><div class="bar"><i style="width:'+l/p.max*100+'%"></i></div></div><div class="mb">'
  +(m?'<b>'+tr('max')+'</b>':'<button class="b'+(ok?' g':'')+'" data-a="pk" data-k="'+p.k+'"'+(ok?'':' disabled')+'>🔮 '+c+'</button>')+'</div></div>'});
 h+='<div class="wh">'+tr('treeI')+'</div><div class="cs"><small class="d">'+tr('treeIn')+'</small></div>';
 PKR.forEach(p=>{const l=S.pk[p.k]||0,m=l>=p.max,c=pkrCost(l),ok=!m&&S.ess>=c;
  h+='<div class="ms'+(m?' ok':'')+'"><div>'+p.ic+' <b>'+tr('pr_'+p.k)+'</b> · '+tr('lvl')+' '+l+(l?' · '+eff(p.k,l):'')+'<small class="d">'+tr('pr_'+p.k+'d')+'</small></div><div class="mb">'
  +(m?'<b>'+tr('max')+'</b>':'<button class="b'+(ok?' g':'')+'" data-a="pr" data-k="'+p.k+'"'+(ok?'':' disabled')+'>🔮 '+c+'</button><button class="b" data-a="prm" data-k="'+p.k+'"'+(ok?'':' disabled')+'>'+tr('buyMax')+'</button>')+'</div></div>'});
 setT('tBody',h)}
const openTree=()=>{$('ups').classList.remove('on');renderTree();$('tree').classList.add('on')};
$('ess').onclick=openTree;$('treeB').onclick=openTree;$('tClose').onclick=()=>$('tree').classList.remove('on');
$('tBody').onclick=e=>{const b=e.target.closest('[data-a]');if(!b||b.disabled)return;const a=b.dataset.a;
 if(a==='pk'){const p=PK.find(x=>x.k===b.dataset.k),l=S.pk[p.k];
  if(!p||l>=p.max||S.ess<p.cost[l])return;S.ess-=p.cost[l];S.pk[p.k]++;sfx('claim');track('perk',{k:p.k,l:S.pk[p.k]});save(true);renderTree();ui()}
 else if(a==='pr'||a==='prm'){const p=PKR.find(x=>x.k===b.dataset.k);if(!p)return;let n=0;
  do{const l=S.pk[p.k]||0,c=pkrCost(l);if(l>=p.max||S.ess<c)break;S.ess-=c;S.pk[p.k]=l+1;n++}while(a==='prm'); // «Max» compra finché le Essenze bastano
  if(n){sfx('claim');track('perk',{k:p.k,l:S.pk[p.k]});save(true);renderTree();ui()}}};
export {renderTree,openTree};

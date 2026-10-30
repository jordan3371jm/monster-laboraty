import {sfx} from '../audio.js';
import {$} from '../core/dom.js';
import {R,S} from '../core/state.js';
import {tr} from '../data/text.js';
import {PK,PKR,pkrCost,PK_A,PK_O,PK_G,PK_B,PK_I,PK_E,PK_V,PK_W,PKR_X,PKR_T,PKR_H} from '../game/economy.js';
import {fmt} from '../core/util.js';
import {save} from '../save.js';
import {track} from '../analytics.js';
import {setT} from './common.js';
import {ui} from './hud.js';

// ---- Albero delle Essenze (si spendono le 🔮): radici con un tetto di livelli + rami davvero infiniti ----
// effetto totale accanto al livello: cosa dà adesso quel ramo
const pct=v=>Math.round(v*1000)/10+'%';
const EFF={s:l=>'+'+l+' '+tr('lvl'),g:l=>'+'+pct(PK_G*l),o:l=>'+'+pct(PK_O*l),a:l=>'-'+pct(PK_A*l),b:l=>'+'+pct(PK_B*l),i:l=>'-'+pct(PK_I*l),
 e:l=>'-'+pct(1-Math.pow(PK_E,l)),v:l=>'-'+pct(PK_V*l),w:l=>'-'+pct(PK_W*l),x:l=>'+'+pct(PKR_X*l),t:l=>'+'+pct(PKR_T*l),h:l=>'+'+pct(PKR_H*l)};
const cost=(p,l)=>p.cost?p.cost(l):pkrCost(l);
const row=(p,fin)=>{const l=S.pk[p.k]||0,m=l>=p.max,c=cost(p,l),ok=!m&&S.ess>=c,n=fin?'pk_':'pr_';
 return '<div class="ms'+(m?' ok':'')+'"><div>'+p.ic+' <b>'+tr(n+p.k)+'</b> · '+tr('lvl')+' '+l+(fin?'/'+p.max:'')+(l?' · '+EFF[p.k](l):'')+'<small class="d">'+tr(n+p.k+'d')+'</small>'
  +(fin?'<div class="bar"><i style="width:'+l/p.max*100+'%"></i></div>':'')+'</div><div class="mb">'
  +(m?'<b>'+tr('max')+'</b>':'<button class="b'+(ok?' g':'')+'" data-a="pk" data-k="'+p.k+'"'+(ok?'':' disabled')+'>🔮 '+fmt(c)+'</button><button class="b" data-a="pkm" data-k="'+p.k+'"'+(ok?'':' disabled')+'>'+tr('buyMax')+'</button>')+'</div></div>'};
function renderTree(){setT('tBody','<div class="cs">🔮 <b>'+fmt(S.ess)+'</b><small class="d">'+tr('pkNote')+'</small></div><div class="wh">'+tr('treeR')+'</div>'
 +PK.map(p=>row(p,1)).join('')+'<div class="wh">'+tr('treeI')+'</div>'+PKR.map(p=>row(p,0)).join(''))}
// L'albero sta nella scheda «Essenze» dei Potenziamenti (prima era una finestra a parte)
const openTree=()=>{R.tabGo=2;$('n2').click()};
$('ess').onclick=openTree;
$('tBody').onclick=e=>{const b=e.target.closest('[data-a]');if(!b||b.disabled)return;const p=PK.find(x=>x.k===b.dataset.k)||PKR.find(x=>x.k===b.dataset.k);if(!p)return;let n=0;
 do{const l=S.pk[p.k]||0,c=cost(p,l);if(l>=p.max||S.ess<c)break;S.ess-=c;S.pk[p.k]=l+1;n++}while(b.dataset.a==='pkm'&&n<1e5); // «Max» compra finché le Essenze bastano
 if(n){sfx('claim');track('perk',{k:p.k,l:S.pk[p.k]});save(true);renderTree();ui()}};
export {renderTree,openTree};

import {sfx} from '../audio.js';
import {$} from '../core/dom.js';
import {R,S} from '../core/state.js';
import {fmt} from '../core/util.js';
import {tr} from '../data/text.js';
import {save} from '../save.js';
import {setT,toast} from './common.js';
import {ui} from './hud.js';
import {track} from '../analytics.js';
import {PROD,buy,catalog,owned,restore} from '../platform.js';
import {adThen} from './ads.js';
import {dayNum} from '../game/economy.js';
import {addT} from '../game/meta.js';

// ---- Negozio 🛒: sempre visibile (dopo lo sblocco dei Potenziamenti).
// In cima un premio gratis con video (1 🎫, SAD_MAX al giorno); sotto i prodotti Playgama. Se la piattaforma non ha i pagamenti
// o un prodotto non ha ancora un prezzo (non creato nel pannello sviluppatore) il prodotto si vede ma non si può comprare.
let CAT=[],busy=false;const SAD_MAX=3;
const what=g=>[g.t?'🎫 +'+g.t:'',g.e?'🔮 +'+g.e:'',g.c?'🪙 +'+fmt(g.c):''].filter(Boolean).join(' · ');
const sadLeft=()=>S.sad.d===dayNum()?Math.max(0,SAD_MAX-S.sad.n):SAD_MAX;
function renderShop(){const left=sadLeft(),price={};CAT.forEach(p=>price[p.id]=String(p.price));
 setT('shopB','<div class="dh">'+tr('shopFree')+'</div>'
 +'<button class="b sh" data-a="ad"'+(left<1||busy?' disabled':'')+'><i>🎫</i><span><b>'+tr('shopAdT')+'</b><small>'+tr('shopAdD').replace('{n}',left).replace('{m}',SAD_MAX)+'</small></span><strong>📺 AD</strong></button>'
 +'<div class="dh">'+tr('shopT')+'</div>'
 +Object.keys(PROD).map(id=>{const d=PROD[id],own=owned(id),pr=price[id],off=!own&&!pr;
  return '<button class="b sh'+(off?' off':'')+'" data-id="'+id+'"'+(own||busy||off?' disabled':'')+'><i>'+d.ic+'</i><span><b>'+tr('p_'+id)+'</b><small>'+tr('p_'+id+'_d')+'</small></span><strong>'+(own?'✓ '+tr('owned'):off?'—':pr)+'</strong></button>'}).join('')
 +'<div class="dc">'+(CAT.length?tr('shopNote'):tr('shopOff'))+'</div>')}
async function initShop(){try{const got=await restore();if(got.length){toast('🛒 '+got.map(what).filter(Boolean).join(' · ')||tr('bought'),1);save(true)}}catch(e){}
 CAT=await catalog();if($('shop').classList.contains('on'))renderShop();ui()}
$('tShop').onclick=()=>{renderShop();$('shop').classList.add('on')};$('shopClose').onclick=()=>$('shop').classList.remove('on');
$('shopB').onclick=async e=>{
 const ad=e.target.closest('[data-a=ad]');if(ad&&!ad.disabled&&!busy){adThen('shop',()=>{const d=dayNum();if(S.sad.d!==d)S.sad={d,n:0};S.sad.n++;addT(1);toast('🎫 +1',1);sfx('claim')}).then(renderShop);return}
 const b=e.target.closest('[data-id]');if(!b||b.disabled||busy)return;const id=b.dataset.id;busy=true;renderShop();
 try{const g=await buy(id);if(g){sfx('win');toast('🛒 '+tr('bought')+(what(g)?' '+what(g):''),1);track('iap',{id});save(true)}}
 catch(x){toast(tr('buyFail'))}
 busy=false;renderShop();ui()};
export {initShop,renderShop};

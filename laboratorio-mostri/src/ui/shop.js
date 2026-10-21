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

// ---- Negozio (acquisti Playgama). Il pulsante 🛒 compare solo se la piattaforma supporta i pagamenti e il catalogo non è vuoto ----
let CAT=[],busy=false;
const what=g=>[g.t?'🎫 +'+g.t:'',g.e?'🔮 +'+g.e:'',g.c?'🪙 +'+fmt(g.c):''].filter(Boolean).join(' · ');
function renderShop(){setT('shopB',CAT.map(p=>{const d=PROD[p.id],own=owned(p.id);
 return '<button class="b sh" data-id="'+p.id+'"'+(own||busy?' disabled':'')+'><i>'+d.ic+'</i><span><b>'+tr('p_'+p.id)+'</b><small>'+tr('p_'+p.id+'_d')+'</small></span><strong>'+(own?'✓ '+tr('owned'):String(p.price||p.priceValue||''))+'</strong></button>'}).join('')
 +'<div class="dc">'+tr('shopNote')+'</div>')}
async function initShop(){try{const got=await restore();if(got.length){toast('🛒 '+got.map(what).filter(Boolean).join(' · ')||tr('bought'),1);save(true)}}catch(e){}
 CAT=await catalog();R.shop=CAT.length>0;ui()}
$('tShop').onclick=()=>{renderShop();$('shop').classList.add('on')};$('shopClose').onclick=()=>$('shop').classList.remove('on');
$('shopB').onclick=async e=>{const b=e.target.closest('[data-id]');if(!b||b.disabled||busy)return;const id=b.dataset.id;busy=true;renderShop();
 try{const g=await buy(id);if(g){sfx('win');toast('🛒 '+tr('bought')+(what(g)?' '+what(g):''),1);track('iap',{id});save(true)}}
 catch(x){toast(tr('buyFail'))}
 busy=false;renderShop();ui()};
export {initShop,renderShop};

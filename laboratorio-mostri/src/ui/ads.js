import {$} from '../core/dom.js';
import {R,S} from '../core/state.js';
import {fmt} from '../core/util.js';
import {trv} from '../data/text.js';
import {earn,incBase} from '../game/economy.js';
import {save} from '../save.js';
import {toast} from './common.js';
import {ui} from './hud.js';
import {renderDaily} from './missions.js';
import {track} from '../analytics.js';

// ---- Pubblicità (Playgama Bridge) ----
function rewarded(pl){return new Promise(res=>{const b=window.bridge;
 if(!R.inited||!b||!b.advertisement||typeof b.advertisement.showRewarded!=='function'){res('unavailable');return}
 let done=false;const fin=r=>{if(done)return;done=true;R.pend=null;res(r)};R.pend=fin;
 try{Promise.resolve(b.advertisement.showRewarded(pl)).catch(()=>fin('failed'))}catch(e){fin('failed')}
 setTimeout(()=>fin('failed'),60000)})}
function inter(place){track('ad_inter',{place});try{const b=window.bridge;if(R.inited&&b&&b.advertisement&&b.advertisement.showInterstitial)Promise.resolve(b.advertisement.showInterstitial(place||'prestige')).catch(()=>{})}catch(e){}}
async function adThen(pl,fn){if(R.pend)return;const r=await rewarded(pl);if(r==='rewarded'){track('ad_'+pl);fn();save(true)}else if(r!=='closed')toast(trv('noad'));renderDaily();ui()}
async function watch(kind){if(R.pend)return;const r=await rewarded(kind);
 if(r==='rewarded'){track('ad_'+kind);
  if(kind==='boost'){S.boost=Math.min(Math.max(Date.now(),S.boost)+60000,Date.now()+300000);toast('⚡ x2')}
  else{const g=Math.max(incBase()*300,50);earn(g);toast('🪙 +'+fmt(g))}
  save();ui()}
 else if(r!=='closed')toast(trv('noad'))}
$('a1').onclick=()=>watch('boost');$('a2').onclick=()=>watch('bonus');
export {rewarded,inter,adThen,watch};

import {AU} from '../audio.js';
import {$} from '../core/dom.js';
import {R,S} from '../core/state.js';
import {fmt} from '../core/util.js';
import {tr,trv} from '../data/text.js';
import {AMV_MS,earn,incBase} from '../game/economy.js';
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
 // rete di sicurezza se l'SDK non risponde mai: dopo 60s si rinuncia, ma solo se il video non è a schermo (uno lungo, o la schermata finale, non perde il premio)
 const wd=()=>{if(done)return;if(AU.ad)setTimeout(wd,15000);else fin('failed')};setTimeout(wd,60000)})}
function inter(place){if(S.iap.na)return;track('ad_inter',{place});try{const b=window.bridge;if(R.inited&&b&&b.advertisement&&b.advertisement.showInterstitial)Promise.resolve(b.advertisement.showInterstitial(place||'prestige')).catch(()=>{})}catch(e){}}
async function adThen(pl,fn){if(R.pend)return;const r=await rewarded(pl);if(r==='rewarded'){track('ad_'+pl);fn();save(true)}else if(r!=='closed')toast(trv('noad'));renderDaily();ui()}
async function watch(kind){if(R.pend)return;const r=await rewarded(kind);
 if(r==='rewarded'){track('ad_'+kind);
  if(kind==='boost'){S.boost=Math.min(Math.max(Date.now(),S.boost)+AMV_MS,Date.now()+3*AMV_MS);toast('⚡ x2 · 5 min')} // x2 per 5 minuti (si accumula fino a 15)
  else if(kind==='merge5'){S.amAd=Math.min(Math.max(Date.now(),S.amAd)+AMV_MS,Date.now()+3*AMV_MS);toast('🔄 '+tr('a3on'))}
  else{const g=Math.max(incBase()*300,50);earn(g);toast('🪙 +'+fmt(g))}
  save();ui()}
 else if(r!=='closed')toast(trv('noad'))}
$('a1').onclick=()=>watch('boost');$('a2').onclick=()=>watch('bonus');$('a3').onclick=()=>watch('merge5');
export {rewarded,inter,adThen,watch};

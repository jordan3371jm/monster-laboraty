import {sfx} from '../audio.js';
import {hidden} from '../core/env.js';
import {$} from '../core/dom.js';
import {R,S} from '../core/state.js';
import {fmt} from '../core/util.js';
import {earn,incBase} from '../game/economy.js';
import {save} from '../save.js';
import {toast} from './common.js';
import {ui} from './hud.js';
import {prog} from './missions.js';

// ---- Eventi casuali a schermo (👻 monete, 💎 boost) ----
function evTick(dt){const el=$('ev');
 if(R.evK){R.evX-=dt;if(R.evX<=0){R.evK=null;el.style.display='none'}return}
 R.evT-=dt;if(R.evT>0)return;
 if(S.tut<3||R.pend||hidden()||document.querySelector('.ov.on,#ups.on')){R.evT=5;return}
 R.evK=Math.random()<.65?'g':'d';R.evX=9;R.evT=(45+Math.random()*60)*(1-.02*(S.pk.v||0));
 el.textContent=R.evK==='g'?'👻':'💎';el.style.left=(8+Math.random()*70)+'%';el.style.top=(24+Math.random()*38)+'%';el.style.display='block'}
$('ev').onpointerdown=e=>{if(!R.evK)return;e.preventDefault();const k=R.evK;R.evK=null;$('ev').style.display='none';S.ach.ev++;prog('event',1);
 if(k==='g'){const c=Math.max(incBase()*30,20);earn(c);toast('👻 🪙 +'+fmt(c))}
 else{S.boost=Math.max(Date.now(),S.boost)+30000;toast('💎 ⚡x2 · 30s')}
 sfx('new');save();ui()};
export {evTick};

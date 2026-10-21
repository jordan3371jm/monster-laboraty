import {R,S} from './core/state.js';
import {amInt,earn,inc,incBase,offRate} from './game/economy.js';
import {offBattle} from './game/combat.js';
import {fight} from './ui/battle.js';
import {evTick} from './ui/events.js';
import {timersTick} from './game/timers.js';
import {ui} from './ui/hud.js';
import {autoEgg,mergeAll} from './ui/lab.js';
import {dayCheck} from './ui/missions.js';
import {showOff} from './ui/rewards.js';
import {chk} from './ui/trophies.js';
import {ivCheck} from './game/meta.js';
import {grantMsg} from './ui/meta.js';
import {has} from './game/unlocks.js';

// ---- Ciclo di gioco ----
function tick(){const n=Date.now();if(R.PZ){R.lastT=n;return}
 const dt=Math.max(0,(n-R.lastT)/1000);R.lastT=n;
 const full=Math.min(dt,5),rest=Math.min(dt-full,8*3600),i=inc();
 let g=i*full,off=0;
 if(rest>0){off=incBase()*rest*offRate();g+=off} // offline senza boost: altrimenti pochi secondi di x2 rimasti raddoppiavano ore di assenza
 earn(g);if(rest>30&&off>0){R.pO+=off;R.pS+=dt;if(has('bat')){const b=offBattle(rest);R.pB+=b.n;R.pC+=b.coins}} // anche la battaglia avanza mentre si è via // accreditato subito: il pulsante «Raddoppia» aggiunge altrettanto
 if(R.pO>0&&!document.hidden){showOff(R.pO,R.pS,R.pB,R.pC);R.pO=0;R.pS=0;R.pB=0;R.pC=0} // una sola finestra al ritorno, anche se la scheda era in background
 if(!document.hidden){S.pt=(S.pt||0)+full;S.an.ls=n}dayCheck();timersTick();if(has('bat'))fight(full);evTick(full);chk();
 autoEgg(full);
 const ivo=ivCheck();if(ivo)grantMsg(ivo); // inizia una nuova invasione: quella vecchia non riscossa si riscuote da sola
 if(S.am){R.autoT+=full;if(R.autoT>=amInt()){R.autoT=0;mergeAll(1)}}else R.autoT=0; // Unione automatica: una coppia ogni amInt() secondi
 ui()}
export {tick};

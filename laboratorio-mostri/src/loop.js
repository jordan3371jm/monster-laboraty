import {R,S} from './core/state.js';
import {AU} from './audio.js';
import {inter} from './ui/ads.js';
import {toast} from './ui/common.js';
import {tr} from './data/text.js';
import {MAXT} from './data/config.js';
import {AMV_INT,amInt,earn,inc,incBase,offRate} from './game/economy.js';
import {offBattle} from './game/combat.js';
import {fight} from './ui/battle.js';
import {evTick} from './ui/events.js';
import {timersTick} from './game/timers.js';
import {ui} from './ui/hud.js';
import {autoEgg,mergeAll,offAuto} from './ui/lab.js';
import {dayCheck} from './ui/missions.js';
import {showOff} from './ui/rewards.js';
import {chk} from './ui/trophies.js';
import {ivCheck} from './game/meta.js';
import {grantMsg} from './ui/meta.js';
import {has} from './game/unlocks.js';

// ---- Ciclo di gioco ----
function tick(){const n=Date.now();if(R.PZ||AU.ad){R.lastT=n;return} // pausa della piattaforma o pubblicità a schermo intero: gioco fermo (regola Playgama)
 // interstitial delle 50 unioni: il gioco non ha pause naturali, quindi (come consiglia Playgama) aspetta 1,5s senza tocchi
 // e poi avvisa con un conto alla rovescia «Pubblicità tra 3…2…1» prima di mostrarla: mai all'improvviso sotto il dito
 if(R.adPend&&!R.adCd&&n-R.lastTap>1500&&!document.hidden){R.adPend=0;R.adCd=n+3000}
 if(R.adCd){const l=Math.ceil((R.adCd-n)/1000);if(l>0){if(l!==R.adCl){R.adCl=l;toast('📺 '+tr('adBreak').replace('{n}',l),1)}}else{R.adCd=0;R.adCl=0;inter('merge')}} // se nel frattempo ha toccato, si aspetta la pausa successiva
 const dt=Math.max(0,(n-R.lastT)/1000);R.lastT=n;
 const full=Math.min(dt,5),rest=Math.min(dt-full,8*3600),i=inc();
 let g=i*full,off=0;
 if(rest>0){off=incBase()*rest*offRate();g+=off} // offline senza boost: altrimenti pochi secondi di x2 rimasti raddoppiavano ore di assenza
 earn(g);if(rest>0){const a=offAuto(rest);R.pE+=a.e;R.pH+=a.m}if(rest>30&&off>0){R.pO+=off;R.pS+=dt;if(has('bat')){const b=offBattle(rest);R.pB+=b.n;R.pC+=b.coins}} // anche la battaglia avanza mentre si è via // accreditato subito: il pulsante «Raddoppia» aggiunge altrettanto
 if(R.pO>0&&!document.hidden){showOff(R.pO,R.pS,R.pB,R.pC,R.pH,R.pE);R.pO=0;R.pS=0;R.pB=0;R.pC=0;R.pH=0;R.pE=0} // una sola finestra al ritorno, anche se la scheda era in background
 if(!document.hidden){S.pt=(S.pt||0)+full;S.an.ls=n}dayCheck();timersTick();if(has('bat'))fight(full);evTick(full);chk();
 autoEgg(full);
 const ivo=ivCheck();if(ivo)grantMsg(ivo); // inizia una nuova invasione: quella vecchia non riscossa si riscuote da sola
 // Unione automatica: una coppia ogni amInt() secondi; prima dello sblocco, il video «Unione 5 minuti» ne fa una ogni AMV_INT secondi a qualsiasi livello
 if(S.am){R.autoT+=full;if(R.autoT>=amInt()){R.autoT=0;mergeAll(1)}}
 else if(n<S.amAd){R.autoT+=full;if(R.autoT>=AMV_INT){R.autoT=0;mergeAll(1,MAXT-1)}}else R.autoT=0;
 ui()}
export {tick};

import {S} from './core/state.js';
import {ANALYTICS_URL} from './data/config.js';
import {dayNum} from './game/economy.js';

// ---- Analytics anonime ----
// Nel salvataggio (S.an) restano sempre: ID casuale, sessioni, giorni giocati e dopo quanti secondi dall'inizio è successo ogni evento per la prima volta.
// Solo se in config.js imposti ANALYTICS_URL gli eventi vengono anche inviati (POST JSON con sendBeacon) al tuo endpoint.
const GAP=30*60e3,ONCE=new Set(['first_spawn','first_merge','first_battle','first_win','first_boss','first_daily','world2','tutorial_done']);
function send(ev,d){if(!ANALYTICS_URL)return;try{const a=S.an,b=JSON.stringify({id:a.id,ev,d:d||null,t:Date.now(),day:dayNum()-a.d0,pt:Math.round(S.pt||0),v:1});
 if(navigator.sendBeacon)navigator.sendBeacon(ANALYTICS_URL,b);else fetch(ANALYTICS_URL,{method:'POST',body:b,keepalive:true})}catch(e){}}
function track(ev,d){const a=S.an;if(!a||!a.id)return;const first=!(ev in a.f);if(first)a.f[ev]=Math.max(1,Math.round((Date.now()-a.fs)/1000));if(ONCE.has(ev)&&!first)return;send(ev,d)}
function initAnalytics(){const a=S.an;if(!a.id){a.id=Math.random().toString(36).slice(2,10)+Date.now().toString(36);a.fs=Date.now();a.d0=dayNum()}
 const dd=dayNum()-a.d0;if(!a.d.includes(dd)){a.d.push(dd);if(a.d.length>400)a.d.shift()}
 if(Date.now()-a.ls>GAP){a.ss++;track('session',{n:a.ss,dd})}a.ls=Date.now()}
export {track,initAnalytics};

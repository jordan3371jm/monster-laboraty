import {AU,aSync,actx} from './audio.js';
import {sleep} from './core/dom.js';
import {R,S} from './core/state.js';
import {tick} from './loop.js';
import {load,save} from './save.js';
import {startFight} from './ui/battle.js';
import {applyLang,ui} from './ui/hud.js';
import {draw} from './ui/lab.js';
import {dailyInfo,dayCheck,openDaily} from './ui/missions.js';
import {drawTimers,openIntro} from './ui/timers.js';
import {ordersExpire} from './game/timers.js';
import {tutDraw} from './ui/tutorial.js';
import {initAnalytics} from './analytics.js';
import {LANGS,pickLang} from './data/text.js';
import {has,ulMigrate} from './game/unlocks.js';
import {lbScore,syncPlay} from './platform.js';
import {initShop} from './ui/shop.js';

import './style.css';

// Salvataggio periodico e sincronizzazione audio
setInterval(()=>save(),5000);
addEventListener('visibilitychange',()=>{if(document.hidden){ordersExpire();save(true)}else drawTimers();aSync();syncPlay()});
addEventListener('pointerdown',()=>{actx();aSync()});

// Il Bridge è caricato async: lo aspetto al massimo 2,5s (subito se il caricamento fallisce, es. offline).
const waitBridge=()=>new Promise(res=>{if(window.bridge)return res(true);if(window.__bridgeFail||!document.querySelector('script[src*="playgama"]'))return res(false);const t0=Date.now(),iv=setInterval(()=>{if(window.bridge||window.__bridgeFail||Date.now()-t0>2500){clearInterval(iv);res(!!window.bridge)}},50)});
async function boot(){
 try{if(await waitBridge()){
  await Promise.race([window.bridge.initialize(),sleep(4000).then(()=>{throw 0})]);R.inited=true;
  R.lang=pickLang(window.bridge.platform.language);
  const ev=(k,f)=>{try{return window.bridge.EVENT_NAME[k]||f}catch(e){return f}};
  try{window.bridge.advertisement.on('rewarded_state_changed',s=>{
   if(s==='opened'){AU.ad=true;aSync()}else if(s==='closed'||s==='failed'){AU.ad=false;aSync()}syncPlay();
   if(!R.pend)return;if(s==='rewarded'||s==='failed'||s==='closed')R.pend(s)})}catch(e){}
  try{window.bridge.advertisement.on(ev('INTERSTITIAL_STATE_CHANGED','interstitial_state_changed'),s=>{AU.ad=s==='opened';aSync();syncPlay()})}catch(e){}
  try{AU.plat=window.bridge.platform.isAudioEnabled!==false;window.bridge.platform.on(ev('AUDIO_STATE_CHANGED','audio_state_changed'),v=>{AU.plat=!!v;aSync()})}catch(e){}
  // pausa della piattaforma: gioco e audio fermi, il tempo in pausa non conta
  try{window.bridge.platform.on(ev('PAUSE_STATE_CHANGED','pause_state_changed'),p=>{R.PZ=!!p;if(R.PZ)save(true);else{R.lastT=Date.now();R.lastO=Date.now()}aSync();syncPlay()})}catch(e){}
 }}catch(e){}
 if(!R.inited)R.lang=pickLang(navigator.language); // lingua del dispositivo se supportata, altrimenti inglese
 try{await load();R.loaded=true;R.lastT=Math.min(S.ls,Date.now());initAnalytics();
  if(LANGS.includes(S.lp))R.lang=S.lp; // lingua scelta nelle impostazioni
  ulMigrate();dayCheck();startFight();applyLang();tutDraw();aSync();draw();drawTimers();ui();setInterval(tick,250);
  if(S.tut>=3&&!S.introSeen&&has('exp'))setTimeout(()=>{S.introSeen=1;openIntro()},900); // una sola volta: spiega i timer da riscuotere
 }catch(e){console.error(e);if(window.__fatal)window.__fatal(e);return} // mai pagina bianca: messaggio con pulsante di reset
 window.__ready=1;const bt=document.getElementById('boot');if(bt)bt.remove();
 if(S.tut>=3&&has('day')&&dailyInfo().can)setTimeout(()=>{if(!R.dlgShown){R.dlgShown=true;openDaily()}},1200);
 try{if(R.inited)window.bridge.platform.sendMessage('game_ready')}catch(e){}
 syncPlay();lbScore();initShop()} // gameplay_started, classifica del livello record, acquisti da ripristinare e catalogo del negozio
boot().catch(e=>{console.error(e);if(window.__fatal)window.__fatal(e)});

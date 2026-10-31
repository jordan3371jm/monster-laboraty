import './ytbridge.js'; // per primo: nel build per YouTube crea window.bridge sopra l'SDK ytgame
import {YT} from './core/env.js';
import {AU,aSync,actx} from './audio.js';
import {sleep} from './core/dom.js';
import {K} from './data/config.js';
import {R,S} from './core/state.js';
import {tick} from './loop.js';
import {load,save} from './save.js';
import {startFight} from './ui/battle.js';
import {applyLang,ui} from './ui/hud.js';
import {draw} from './ui/lab.js';
import {dailyInfo,dayCheck,openDaily} from './ui/missions.js';
import {drawTimers,openIntro,openTm} from './ui/timers.js';
import {ordersExpire} from './game/timers.js';
import {tutDraw} from './ui/tutorial.js';
import {initAnalytics} from './analytics.js';
import {LANGS,pickLang} from './data/text.js';
import {has,ulMigrate} from './game/unlocks.js';
import {launchPayload,lbScore,syncPlay} from './platform.js';
import {initShop} from './ui/shop.js';

import './style.css';
import {initCoins} from './ui/coin.js';
import {initMonsters} from './ui/monsters.js';
import {bootProgress,preWait,preload} from './preload.js';
import {ch as chState,form} from './game/meta.js';

// Le immagini iniziano a caricarsi subito, in parallelo all'avvio del Bridge e al caricamento del salvataggio
preload();initMonsters();initCoins();

// Salvataggio periodico e sincronizzazione audio
setInterval(()=>save(),5000);
setInterval(()=>lbScore(),60000); // classifica delle monete (il livello record parte a ogni livello vinto)
if(!YT)addEventListener('visibilitychange',()=>{if(document.hidden){ordersExpire();save(true)}else drawTimers();aSync();syncPlay()});
addEventListener('pointerdown',()=>{R.lastTap=Date.now();actx();aSync()});
// Regole delle piattaforme: niente menu del tasto destro, niente zoom (pizzico, Ctrl+rotella) e i tasti non fanno scorrere la pagina
addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('wheel',e=>{if(e.ctrlKey)e.preventDefault()},{passive:false});
for(const e of ['gesturestart','gesturechange'])addEventListener(e,ev=>ev.preventDefault());
addEventListener('keydown',e=>{if([' ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','PageUp','PageDown','Home','End'].includes(e.key)&&!/INPUT|TEXTAREA/.test(e.target.tagName))e.preventDefault()});
// Esc chiude la finestra aperta più in alto (pulsante ✕ «...Close» o la chiusura dei Potenziamenti); senza preventDefault
addEventListener('keydown',e=>{if(e.key!=='Escape')return;const o=[...document.querySelectorAll('.ov.on,#ups.on')].pop();const c=o&&(o.id==='ups'?document.getElementById('closeUps'):o.querySelector('[id$="Close"]'));if(c)c.click()});
// L'app (o il browser del telefono) può chiudere la pagina senza visibilitychange: salvo anche qui
if(!YT)for(const e of ['pagehide','freeze','beforeunload'])addEventListener(e,()=>save(true));

// Il Bridge è caricato async: lo aspetto al massimo 5s (subito se il caricamento fallisce, es. offline) e initialize() al massimo 6s.
// Se arriva più tardi (rete lenta, app di Playgama) non lo perdo: lateBridge() lo collega appena c'è e recupera il salvataggio della piattaforma.
const waitBridge=ms=>new Promise(res=>{if(window.bridge)return res(true);if(window.__bridgeFail||!document.querySelector('script[src*="playgama"]'))return res(false);const t0=Date.now(),iv=setInterval(()=>{if(window.bridge||window.__bridgeFail||Date.now()-t0>ms){clearInterval(iv);res(!!window.bridge)}},50)});
let initP=null,adWd=0;
// un tocco sul gioco vuol dire che nessuna pubblicità lo copre: se il gioco era rimasto in pausa (annuncio mai chiuso), riparte subito
// fine della pausa della piattaforma (scheda in secondo piano, altra app): il tempo passato fuori conta come assenza
// (monete offline e Laboratorio notturno), come se il gioco fosse stato chiuso. Prima veniva buttato via.
function pzEnd(){if(R.pzAt){R.offS=(R.offS||0)+Math.max(0,(Date.now()-R.pzAt)/1000);R.pzAt=0}R.lastT=Date.now()}
addEventListener('pointerdown',()=>{if(!AU.ad&&!R.PZ)return;AU.ad=false;R.PZ=false;pzEnd();clearTimeout(adWd);aSync();syncPlay()},true);
function hookBridge(){R.inited=true;
 const ev=(k,f)=>{try{return window.bridge.EVENT_NAME[k]||f}catch(e){return f}};
 try{window.bridge.advertisement.on('rewarded_state_changed',s=>{
  if(s==='opened'){AU.ad=true;aSync()}else if(s==='closed'||s==='failed'){AU.ad=false;aSync()}syncPlay();
  if(!R.pend)return;if(s==='rewarded'||s==='failed'||s==='closed')R.pend(s)})}catch(e){}
 // a volte Playgama manda «opened» per l'interstitial e mai «closed»: senza questa rete il gioco restava fermo (contatori bloccati)
 // finché non si apriva un'altra schermata. Dopo 90s senza chiusura il gioco riparte da solo.
 try{window.bridge.advertisement.on(ev('INTERSTITIAL_STATE_CHANGED','interstitial_state_changed'),s=>{AU.ad=s==='opened';clearTimeout(adWd);
  if(AU.ad)adWd=setTimeout(()=>{if(AU.ad){AU.ad=false;aSync();syncPlay()}},90000);aSync();syncPlay()})}catch(e){}
 try{const a=window.bridge.advertisement;if(a.interstitialState==='opened'||a.rewardedState==='opened')AU.ad=true}catch(e){} // un annuncio già aperto all'avvio: muto e in pausa
 try{AU.plat=window.bridge.platform.isAudioEnabled!==false;window.bridge.platform.on(ev('AUDIO_STATE_CHANGED','audio_state_changed'),v=>{AU.plat=!!v;aSync()})}catch(e){}
 // pausa della piattaforma: gioco e audio fermi, il tempo in pausa non conta
 try{window.bridge.platform.on(ev('PAUSE_STATE_CHANGED','pause_state_changed'),p=>{R.PZ=!!p;if(R.PZ){save(true);R.pzAt=R.pzAt||Date.now()}else{pzEnd();R.lastO=Date.now()}aSync();syncPlay()})}catch(e){}}
// Dopo game_ready: gameplay_started, classifica del livello record, acquisti da ripristinare e catalogo del negozio
function ready(){try{if(R.inited)window.bridge.platform.sendMessage('game_ready')}catch(e){}syncPlay();lbScore();initShop()
 if(/^(exp|egg)_ready$/.test(launchPayload())&&has('exp'))setTimeout(openTm,1500)} // aperto da una notifica «spedizione/uovo pronto»: si va alle Avventure
const redraw=()=>{ulMigrate();dayCheck();startFight();applyLang();tutDraw();aSync();draw();drawTimers();ui()};
async function boot(){
 try{if(await waitBridge(5000)){initP=Promise.resolve(window.bridge.initialize());
  await Promise.race([initP,sleep(6000).then(()=>{throw 0})]);hookBridge();R.lang=pickLang(window.bridge.platform.language)}}catch(e){}
 if(!R.inited)R.lang=YT?'en':pickLang(navigator.language); // lingua del dispositivo se supportata, altrimenti inglese
 try{await load();R.loaded=true;R.lastT=Date.now();R.offS=Math.max(0,(Date.now()-S.ls)/1000);/* assenza: la conta il primo giro del ciclo di gioco, anche se all'avvio c'è una pubblicità */initAnalytics();
  if(!YT&&LANGS.includes(S.lp))R.lang=S.lp; // lingua scelta nelle impostazioni (su YouTube vale solo quella dell'account)
  redraw();setInterval(tick,250);
  if(S.tut>=3&&!S.introSeen&&has('exp'))setTimeout(()=>{S.introSeen=1;openIntro()},900); // una sola volta: spiega i timer da riscuotere
 }catch(e){console.error(e);if(window.__fatal)window.__fatal(e);return} // mai pagina bianca: messaggio con pulsante di reset
 await preWait(bootProgress,S.wd,chState().ld.map(form)); // schermata di caricamento: nemici del mondo raggiunto e capisquadra (al massimo 25s)
 window.__ready=1;const bt=document.getElementById('boot');if(bt){bootProgress(1,1);bt.classList.add('out');setTimeout(()=>bt.remove(),500)}
 if(S.tut>=3&&has('day')&&dailyInfo().can)setTimeout(()=>{if(!R.dlgShown){R.dlgShown=true;openDaily()}},1200);
 if(R.inited)ready();else{syncPlay();initShop();lateBridge()}}
// Bridge arrivato tardi: lo collego e, se il salvataggio della piattaforma ha più tempo di gioco di quello partito in locale
// (es. l'app ha cancellato i dati del browser), riparto da quello. Poi salvo subito anche sulla piattaforma.
async function lateBridge(){const t0=Date.now();
 while(!window.bridge&&!window.__bridgeFail&&Date.now()-t0<60000)await sleep(1000);
 if(!window.bridge||R.inited)return;
 try{await (initP||window.bridge.initialize())}catch(e){return}
 hookBridge();let cl=null;
 try{const r=await Promise.race([window.bridge.storage.get(K),sleep(5000).then(()=>null)]);cl=typeof r==='string'?JSON.parse(r):r}catch(e){}
 if(cl&&Array.isArray(cl.g)&&(cl.pt||0)>(S.pt||0)){await load();R.lastT=Date.now();R.offS=Math.max(0,(Date.now()-S.ls)/1000);if(!YT&&LANGS.includes(S.lp))R.lang=S.lp;redraw()}
 save(true);ready()}
boot().catch(e=>{console.error(e);if(window.__fatal)window.__fatal(e)});

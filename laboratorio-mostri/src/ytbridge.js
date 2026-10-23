import {YT} from './core/env.js';

// ---- YouTube Playables: adattatore con la stessa forma di Playgama Bridge ----
// Nel build per YouTube il gioco non carica il Bridge: questo oggetto window.bridge traduce le chiamate verso ytgame
// (SDK caricato in index.html prima del gioco), così platform.js, save.js, ads.js e main.js restano uguali.
// Cosa YouTube non ha (acquisti, banner, notifiche, account, social, obiettivi) risulta «non supportato» e il gioco lo nasconde.
function make(y){const L={},on=(k,f)=>{(L[k]=L[k]||[]).push(f)},emit=(k,v)=>(L[k]||[]).forEach(f=>{try{f(v)}catch(e){}});
 let loadP=null;
 // gameReady solo quando la schermata di caricamento è sparita del tutto (regola di certificazione)
 const gameReady=()=>{if(document.getElementById('boot'))return setTimeout(gameReady,100);try{y.game.gameReady()}catch(e){}};
 // gli id dei premi sono fissi e leggibili (niente dati del giocatore): uno per tipo di premio
 const rid=pl=>'reward-'+String(pl||'bonus').toLowerCase().replace(/[^a-z0-9-]/g,'-');
 const ad={rewardedState:'closed',interstitialState:'closed',isAdvancedBannersSupported:false,on,
  showRewarded(pl){ad.rewardedState='opened';emit('rewarded_state_changed','opened');
   return Promise.resolve().then(()=>y.ads.requestRewardedAd(rid(pl))).then(ok=>{ad.rewardedState='closed';emit('rewarded_state_changed',ok?'rewarded':'closed');emit('rewarded_state_changed','closed')},
    ()=>{ad.rewardedState='closed';emit('rewarded_state_changed','failed')})},
  // l'interstitial ogni 50 unioni cadrebbe in mezzo al gioco (vietato su YouTube): restano solo quelli ai cambi di schermata
  showInterstitial(place){if(place==='merge')return Promise.resolve();ad.interstitialState='opened';emit('interstitial_state_changed','opened');
   const end=()=>{ad.interstitialState='closed';emit('interstitial_state_changed','closed')};
   return Promise.resolve().then(()=>y.ads.requestInterstitialAd()).then(end,end)},
  hideAdvancedBanners(){},showAdvancedBanners(){}};
 const B={platform:{id:'youtube',language:'en',payload:'',isAudioEnabled:true,on,
   sendMessage(m){if(m==='game_ready')gameReady();return Promise.resolve()}},
  advertisement:ad,
  // cloud save di YouTube: una sola stringa (la chiave non serve). loadData va atteso prima di qualsiasi saveData.
  storage:{get(){loadP=loadP||Promise.resolve().then(()=>y.game.loadData());return loadP.then(s=>s||null)},
   set(k,v){if(!loadP)return Promise.reject(new Error('load first'));return loadP.then(()=>y.game.saveData(String(v)))}},
  leaderboards:{type:'single',setScore(id,v){return y.engagement.sendScore({value:Math.max(0,Math.floor(Number(v)||0))})}},
  payments:{isSupported:false},notifications:{isSupported:false},player:{isAuthorizationSupported:false,isAuthorized:false},social:{},
  async initialize(){try{y.game.firstFrameReady()}catch(e){} // la schermata di caricamento è già a schermo
   try{B.platform.language=String(await y.system.getLanguage()||'en')}catch(e){}
   try{B.platform.isAudioEnabled=y.system.isAudioEnabled()!==false}catch(e){}
   try{y.system.onAudioEnabledChange(v=>{B.platform.isAudioEnabled=!!v;emit('audio_state_changed',!!v)})}catch(e){}
   try{y.system.onPause(()=>{document.documentElement.classList.add('pz');emit('pause_state_changed',true)})}catch(e){}
   try{y.system.onResume(()=>{document.documentElement.classList.remove('pz');emit('pause_state_changed',false)})}catch(e){}}};
 return B}
if(YT&&typeof window!=='undefined'){document.documentElement.classList.add('yt');if(window.ytgame&&!window.bridge)window.bridge=make(window.ytgame)}
export {make};

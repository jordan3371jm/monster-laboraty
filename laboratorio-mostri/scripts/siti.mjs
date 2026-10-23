// ---- Una cartella (e uno zip) per ogni sito dove pubblicare il gioco: npm run siti ----
// Parte dai build già fatti: dist (Playgama) e dist-yt (YouTube). Crea siti/<nome>/ e siti/<nome>.zip.
// - Siti supportati da Playgama Bridge: Bridge in locale (niente CDN esterno) e piattaforma fissata nel config (forciblySetPlatformId)
// - GameMonetize: adattatore che presenta il suo SDK con la forma di window.bridge (pubblicità con sdk.showBanner)
// - Siti senza SDK (itch.io, Newgrounds, Armor Games, GamePix): versione web senza pubblicità, salvataggio nel browser
import {cpSync,existsSync,mkdirSync,readFileSync,rmSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';

const OUT='siti',CDN=/<!-- Playgama Bridge dal CDN[^\n]*\n<script src="https:\/\/bridge\.playgama\.com[^\n]*<\/script>\n?/;
if(!existsSync('dist/index.html')||!existsSync('dist-yt/index.html'))throw new Error('Prima: npm run build && npm run build:yt');
const html=readFileSync('dist/index.html','utf8');if(!CDN.test(html))throw new Error('script del Bridge non trovato in dist/index.html');
const cfg=JSON.parse(readFileSync('dist/playgama-bridge-config.json','utf8'));
const BRIDGE='node_modules/@playgama/bridge/dist/playgama-bridge.js';
// Codice del gioco dentro index.html (in fondo al body, come faceva defer): alcuni caricatori (es. CrazyGames) perdevano la cartella assets/
const JS=/<script defer src="\.\/assets\/(index-[\w-]+\.js)"><\/script>\n?/;
function inl(h,d){const m=h.match(JS);if(!m)throw new Error('script del gioco non trovato');const code=readFileSync('dist/assets/'+m[1],'utf8');
 if(code.includes('</script'))throw new Error('il codice contiene </script>');rmSync(d+'/assets/'+m[1],{force:true});
 return h.replace(JS,'').replace('</body>',()=>'<script>'+code+'</script>\n</body>')}
const DA='INSERISCI_QUI'; // segnaposto per gli id che ti dà il sito quando registri il gioco

// pid = id della piattaforma in Bridge; extra = impostazioni del sito nel config; files = file in più nella cartella
const BR={
 poki:{pid:'poki',url:'https://developers.poki.com',note:'Poki seleziona i giochi: compila la richiesta su developers.poki.com. Di solito vuole l\'esclusiva sul web (anche 5 anni) e potrebbe rifiutare un gioco già pubblicato altrove. Gli acquisti con soldi veri non compaiono (Poki non li ha).'},
 yandex:{pid:'yandex',url:'https://yandex.com/dev/games/doc/en/',note:'Console per sviluppatori di Yandex Games: «Add application», carica lo zip, compila nome, descrizioni e immagini (il gioco ha già il russo, che Yandex richiede). Il pagamento minimo è 100 €.'},
 y8:{pid:'y8',url:'https://developer.y8.com',note:'Carica il gioco dal portale sviluppatori di Y8 (serve un account Y8). Le pubblicità le gestisce Y8 tramite Bridge.'},
 lagged:{pid:'lagged',url:'https://lagged.dev',extra:{devId:DA+'_DEV_ID',publisherId:DA+'_PUBLISHER_ID'},need:'lagged.devId e lagged.publisherId',note:'Registrati come sviluppatore su Lagged: ti danno devId e publisherId. Mettili in playgama-bridge-config.json, ricomprimi e carica.'},
 facebook:{pid:'facebook',url:'https://developers.facebook.com/apps',files:{'fbapp-config.json':JSON.stringify({instant_games:{platform_version:'RICH_GAMEPLAY',navigation_menu_version:'NAV_FLOATING'}},null,2)},note:'Crea un\'app «Instant Games» su developers.facebook.com, vai su «Web hosting» e carica lo zip (contiene già fbapp-config.json). Facebook non è chiaro se accetti ancora giochi nuovi.'},
 telegram:{pid:'telegram',url:'https://partner.adsgram.ai',extra:{adsgramBlockId:DA+'_ADSGRAM_BLOCK_ID'},need:'telegram.adsgramBlockId',note:'Telegram non ospita i file: carica questa cartella su un sito (es. GitHub Pages), crea un bot con @BotFather e collega l\'indirizzo come Mini App. Per le pubblicità registrati su Adsgram e metti il «block id» nel config.'},
};

const LEGGIMI=(nome,url,note,need)=>`MONSTER LABORATORY · versione per ${nome}

Come pubblicarlo
${note}

Dove: ${url}
${need?`\nDA COMPLETARE PRIMA DI CARICARE: in playgama-bridge-config.json sostituisci ${need} (cerca «${DA}»).\n`:''}
Per caricarlo: comprimi in .zip il CONTENUTO di questa cartella (index.html deve stare subito dentro lo zip, non in una sottocartella),
oppure usa lo zip già pronto con lo stesso nome nella cartella siti/.
Immagini e descrizioni per la scheda del gioco: store/ (copertine 1:1, 9:16, 16:9 e store/descrizioni.md, in 6 lingue).
`;

function site(nome,fn){const d=OUT+'/'+nome;rmSync(d,{recursive:true,force:true});mkdirSync(d,{recursive:true});fn(d);
 rmSync(d+'.zip',{force:true});execFileSync('zip',['-qr','../'+nome+'.zip','.'],{cwd:d});console.log('✓',nome)}
const base=(d,src='dist')=>{cpSync(src,d,{recursive:true});rmSync(d+'/playgama-bridge-config.json',{force:true})};

mkdirSync(OUT,{recursive:true});
// Playgama: il build di sempre, Bridge dal CDN come chiede Playgama
site('playgama',d=>{cpSync('dist',d,{recursive:true});writeFileSync(d+'/LEGGIMI.txt',LEGGIMI('Playgama','https://developer.playgama.com','Carica lo zip nel pannello sviluppatori di Playgama. Da lì il gioco arriva anche ai siti partner di Playgama (MSN, Microsoft Store, Huawei, Xiaomi, Samsung…).'))});
// Siti con Bridge in locale
for(const [nome,s] of Object.entries(BR))site(nome,d=>{base(d);cpSync(BRIDGE,d+'/playgama-bridge.js');
 const c=structuredClone(cfg);c.forciblySetPlatformId=s.pid;c.platforms={[s.pid]:s.extra||{}};
 writeFileSync(d+'/playgama-bridge-config.json',JSON.stringify(c,null,4));
 writeFileSync(d+'/index.html',inl(html.replace(CDN,(s.sdk?'<script src="'+s.sdk+'"></script>\n':'')+'<script src="playgama-bridge.js" onerror="window.__bridgeFail=1"></script>\n'),d));
 for(const [f,t] of Object.entries(s.files||{}))writeFileSync(d+'/'+f,t);
 writeFileSync(d+'/LEGGIMI.txt',LEGGIMI(nome,s.url,s.note,s.need))});
// YouTube Playables: build dedicato (vedi store/youtube/LEGGIMI.md)
site('youtube',d=>{cpSync('dist-yt',d,{recursive:true});writeFileSync(d+'/LEGGIMI.txt',LEGGIMI('YouTube Playables','https://developers.google.com/youtube/gaming/playables','Prima compila il modulo di interesse di YouTube (accesso su invito). Tutti i passi in store/youtube/LEGGIMI.md.'))});

// GameMonetize: il suo SDK ha solo sdk.showBanner() (video a schermo intero). Il video premio usa lo stesso annuncio e dà il premio quando finisce.
const GM=`<script>
// GameMonetize: adattatore con la forma di Playgama Bridge (window.bridge) sopra il loro SDK
(function(){var L={},cur=null,wd=0;function on(k,f){(L[k]=L[k]||[]).push(f)}function emit(k,v){(L[k]||[]).forEach(function(f){try{f(v)}catch(e){}})}
function ev(k){return cur==='r'?'rewarded_state_changed':'interstitial_state_changed'}
function end(ok){clearTimeout(wd);if(cur==='r'){if(ok)emit('rewarded_state_changed','rewarded');emit('rewarded_state_changed',ok?'closed':'failed')}else if(cur==='i')emit('interstitial_state_changed','closed');cur=null}
function show(k){if(cur)return Promise.resolve();if(typeof sdk==='undefined'||!sdk.showBanner){if(k==='r')emit('rewarded_state_changed','failed');return Promise.resolve()}
 cur=k;emit(ev(),'opened');wd=setTimeout(function(){end(false)},4000); // nessun annuncio entro 4s: niente premio
 try{sdk.showBanner()}catch(e){end(false)}return Promise.resolve()}
window.SDK_OPTIONS={gameId:"${DA}_GAME_ID",onEvent:function(a){
 if(a.name==='SDK_GAME_PAUSE'){if(cur)clearTimeout(wd);else emit('pause_state_changed',true)}
 else if(a.name==='SDK_GAME_START'){if(cur)end(true);else emit('pause_state_changed',false)}}};
window.bridge={platform:{id:'gamemonetize',language:navigator.language||'en',payload:'',isAudioEnabled:true,on:on,sendMessage:function(){return Promise.resolve()}},
 advertisement:{isAdvancedBannersSupported:false,rewardedState:'closed',interstitialState:'closed',on:on,showInterstitial:function(){return show('i')},showRewarded:function(){return show('r')},showAdvancedBanners:function(){},hideAdvancedBanners:function(){}},
 storage:{get:function(k){try{return Promise.resolve(localStorage.getItem(k))}catch(e){return Promise.resolve(null)}},set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}return Promise.resolve()}},
 payments:{isSupported:false},notifications:{isSupported:false},player:{isAuthorizationSupported:false,isAuthorized:false},social:{},leaderboards:{type:'not_available'},
 initialize:function(){return Promise.resolve()}};
var s=document.createElement('script');s.id='gamemonetize-sdk';s.src='https://api.gamemonetize.com/sdk.js';document.head.appendChild(s)})();
</script>
`;

// Un solo file: immagini e suoni dentro index.html come data: URI (il caricatore di CrazyGames riceveva solo index.html)
import {readdirSync} from 'node:fs';
function one(h,d){const A={},b64=(f,t)=>'data:'+t+';base64,'+readFileSync(d+'/'+f).toString('base64');
 for(const f of readdirSync(d+'/m'))A['m/'+f]=b64('m/'+f,'image/webp');
 for(const f of readdirSync(d+'/sfx'))A['sfx/'+f]=b64('sfx/'+f,'audio/mpeg');
 for(const f of ['boot-h.webp','boot-v.webp'])h=h.split('url('+f+')').join('url('+b64(f,'image/webp')+')');
 h=h.split('src="m/lumizucca.webp"').join('src="'+A['m/lumizucca.webp']+'"');
 // nel codice: percorsi m/… e sfx/… passano da __u()
 const before=h.length;
 h=h.split('src="m/`+e+`.webp"').join('src="`+__u(`m/`+e+`.webp`)+`"');
 h=h.split('src="m/`+e.slice(1)+`.webp"').join('src="`+__u(`m/`+e.slice(1)+`.webp`)+`"');
 h=h.replace(/`m\/`\+e\+`\.webp`/g,'__u(`m/`+e+`.webp`)').split('fetch(`sfx/`+t+`.mp3`)').join('fetch(__u(`sfx/`+t+`.mp3`))');
 if(/src="m\/`|[^(]`m\/`\+|fetch\(`sfx/.test(h))throw new Error('percorsi m/ o sfx/ non convertiti');
 h=h.replace('<script src="https://sdk.crazygames.com','<script>window.__A='+JSON.stringify(A)+';window.__u=function(p){return window.__A[p]||p}</script>\n<script src="https://sdk.crazygames.com');
 for(const f of readdirSync(d))if(f!=='index.html')rmSync(d+'/'+f,{recursive:true,force:true});
 return h}

// CrazyGames: collegamento diretto al loro SDK v3 (con Bridge il loro controllo non rilevava lo SDK e le pubblicità non partivano)
const CG=`<script src="https://sdk.crazygames.com/crazygames-sdk-v3.js"></script>
<script>
// CrazyGames SDK v3 con la forma di Playgama Bridge (window.bridge): pubblicità, salvataggio (modulo data), audio, caricamento e partita
(function(){var L={},C=null,ok=false,initErr='';function on(k,f){(L[k]=L[k]||[]).push(f)}function emit(k,v){(L[k]||[]).forEach(function(f){try{f(v)}catch(e){}})}
function sdk(){return window.CrazyGames&&window.CrazyGames.SDK}
// motivo di una pubblicità non partita, nella console (es. adsDisabledBasicLaunch: niente pubblicità durante il Basic Launch)
function why(t){try{console.warn('CrazyGames: '+t)}catch(e){}}
function errTxt(e){try{return e&&(e.code||e.message)?(e.code||'')+' '+(e.message||''):JSON.stringify(e)}catch(x){return String(e)}}
function ad(type,ev,rew){return new Promise(function(res){var s=sdk();if(!s){why('SDK non caricato');if(rew)emit(ev,'failed');return res()}if(!ok)why('init non completato ('+initErr+'), provo lo stesso');
 try{s.ad.requestAd(type,{adStarted:function(){emit(ev,'opened')},
  adFinished:function(){if(rew)emit(ev,'rewarded');emit(ev,'closed');res()},
  adError:function(e){why('adError '+errTxt(e));emit(ev,rew?'failed':'closed');res()}})}catch(e){why('eccezione '+errTxt(e));emit(ev,rew?'failed':'closed');res()}})}
var B={platform:{id:'crazy_games',language:navigator.language||'en',payload:'',isAudioEnabled:true,on:on,
  sendMessage:function(m){var s=sdk();if(ok&&s)try{if(m==='game_ready')s.game.loadingStop();else if(m==='gameplay_started')s.game.gameplayStart();else if(m==='gameplay_stopped')s.game.gameplayStop()}catch(e){}return Promise.resolve()}},
 advertisement:{isAdvancedBannersSupported:false,rewardedState:'closed',interstitialState:'closed',on:on,
  showRewarded:function(){return ad('rewarded','rewarded_state_changed',true)},showInterstitial:function(){return ad('midgame','interstitial_state_changed',false)},
  showAdvancedBanners:function(){},hideAdvancedBanners:function(){}},
 storage:{get:function(k){try{var s=sdk();return Promise.resolve(ok&&s&&s.data?s.data.getItem(k):localStorage.getItem(k))}catch(e){return Promise.resolve(null)}},
  set:function(k,v){try{var s=sdk();if(ok&&s&&s.data)s.data.setItem(k,v);else localStorage.setItem(k,v)}catch(e){}return Promise.resolve()}},
 payments:{isSupported:false},notifications:{isSupported:false},player:{isAuthorizationSupported:false,isAuthorized:false},social:{},leaderboards:{type:'not_available'},
 initialize:function(){var s=sdk();if(!s)return Promise.resolve();return Promise.resolve(s.init()).then(function(){ok=true;
  try{s.game.loadingStart()}catch(e){}
  try{B.platform.isAudioEnabled=!s.game.settings.muteAudio;s.game.addSettingsChangeListener(function(st){B.platform.isAudioEnabled=!st.muteAudio;emit('audio_state_changed',!st.muteAudio)})}catch(e){}
 }).catch(function(e){initErr=errTxt(e)})}};
window.bridge=B})();
</script>
`;
// GameDistribution: collegamento diretto al loro SDK (main.min.js), come richiede il loro controllo dell'implementazione
const GDID='50a89496e16648efa938585b3806a130';
const GDS=`<script>
// GameDistribution SDK con la forma di Playgama Bridge (window.bridge). Pausa e muto su SDK_GAME_PAUSE, ripresa su SDK_GAME_START,
// premio del video solo con SDK_REWARDED_WATCH_COMPLETE (annuncio guardato per intero)
(function(){var L={},cur=null,got=false;function on(k,f){(L[k]=L[k]||[]).push(f)}function emit(k,v){(L[k]||[]).forEach(function(f){try{f(v)}catch(e){}})}
function sdk(){return typeof gdsdk!=='undefined'&&gdsdk.showAd?gdsdk:null}
function ev(){return cur==='r'?'rewarded_state_changed':'interstitial_state_changed'}
function done(ok){if(!cur)return;var e=ev();if(cur==='r'){if(ok&&got)emit(e,'rewarded');emit(e,got?'closed':'failed')}else emit(e,'closed');cur=null}
function show(k){var s=sdk();if(cur)return Promise.resolve();if(!s){if(k==='r')emit('rewarded_state_changed','failed');return Promise.resolve()}
 cur=k;got=false;emit(ev(),'opened');
 return Promise.resolve().then(function(){return k==='r'?s.showAd('rewarded'):s.showAd()}).then(function(){done(true)},function(){done(false)})}
window.GD_OPTIONS={gameId:'${GDID}',onEvent:function(event){var n=event&&event.name;
 if(n==='SDK_REWARDED_WATCH_COMPLETE')got=true;
 else if(n==='SDK_GAME_PAUSE'){if(!cur)emit('pause_state_changed',true)}
 else if(n==='SDK_GAME_START'){if(!cur)emit('pause_state_changed',false)}}};
var pre=false; // una pubblicità all'avvio, appena il gioco è pronto (GameDistribution la usa per verificare lo SDK)
window.bridge={platform:{id:'game_distribution',language:navigator.language||'en',payload:'',isAudioEnabled:true,on:on,sendMessage:function(m){if(m==='game_ready'&&!pre){pre=true;setTimeout(function(){show('i')},300)}return Promise.resolve()}},
 advertisement:{isAdvancedBannersSupported:false,rewardedState:'closed',interstitialState:'closed',on:on,showInterstitial:function(){return show('i')},showRewarded:function(){return show('r')},showAdvancedBanners:function(){},hideAdvancedBanners:function(){}},
 storage:{get:function(k){try{return Promise.resolve(localStorage.getItem(k))}catch(e){return Promise.resolve(null)}},set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}return Promise.resolve()}},
 payments:{isSupported:false},notifications:{isSupported:false},player:{isAuthorizationSupported:false,isAuthorized:false},social:{},leaderboards:{type:'not_available'},
 initialize:function(){return Promise.resolve()}};
(function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(d.getElementById(id))return;js=d.createElement(s);js.id=id;js.src='https://html5.api.gamedistribution.com/main.min.js';fjs.parentNode.insertBefore(js,fjs)}(document,'script','gamedistribution-jssdk'));
})();
</script>
`;
site('gamedistribution',d=>{base(d);writeFileSync(d+'/index.html',inl(html.replace(CDN,GDS),d));
 writeFileSync(d+'/LEGGIMI.txt',LEGGIMI('GameDistribution','https://gamedistribution.com/developers','Game ID già inserito ('+GDID+'). Carica lo zip, apri il gioco nell\'iframe di prova e guarda un annuncio per intero (pulsante 📺 nel gioco, dal mostro di livello 4).'))});

site('crazygames',d=>{base(d);writeFileSync(d+'/index.html',one(inl(html.replace(CDN,CG),d),d));
 writeFileSync(d+'/LEGGIMI.txt',LEGGIMI('crazygames','https://developer.crazygames.com','Registrati come sviluppatore, «Submit game» e carica il file index.html (contiene tutto: immagini, suoni e codice). CrazyGames vuole: pubblico 13+, caricamento sotto 5 secondi, gioco che tiene 20+ minuti. '))});
site('gamemonetize',d=>{base(d);writeFileSync(d+'/index.html',inl(html.replace(CDN,GM),d));
 writeFileSync(d+'/LEGGIMI.txt',LEGGIMI('GameMonetize','https://gamemonetize.com','Registrati come sviluppatore, crea il gioco in «Game Management» e copia il «Game ID». Poi clicca «Verify Game» e «Request activation». GameMonetize ha solo video a schermo intero: il video premio usa lo stesso annuncio e dà il premio quando finisce.','il Game ID in index.html (cerca «'+DA+'_GAME_ID»)'))});

// Versione web senza SDK: niente pubblicità, salvataggio nel browser
const WEB={itchio:['itch.io','https://itch.io/game/new','Crea il gioco, scegli «HTML» come tipo, carica lo zip e spunta «This file will be played in the browser». Imposta la finestra (es. 1280×720, con pulsante schermo intero e «mobile friendly»). Su itch.io si guadagna solo con donazioni o vendite.'],
 newgrounds:['Newgrounds','https://www.newgrounds.com/projects/games','Crea un progetto «Game», carica lo zip come HTML5. Newgrounds condivide con te parte delle sue pubblicità.'],
 armorgames:['Armor Games','https://armorgames.com/contact','Armor Games non ha un caricamento libero: scrivi proponendo il gioco (link GitHub Pages + questo zip) per una sponsorizzazione.'],
 gamepix:['GamePix','https://www.gamepix.com','Registrati come sviluppatore GamePix e invia il gioco: integrano loro il loro SDK. Se ti chiedono di integrarlo tu, dimmelo e preparo una versione apposta.']};
for(const [nome,[n,url,note]] of Object.entries(WEB))site(nome,d=>{base(d);writeFileSync(d+'/index.html',inl(html.replace(CDN,''),d));writeFileSync(d+'/LEGGIMI.txt',LEGGIMI(n,url,note))});

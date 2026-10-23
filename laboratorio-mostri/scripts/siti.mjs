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
const DA='INSERISCI_QUI'; // segnaposto per gli id che ti dà il sito quando registri il gioco

// pid = id della piattaforma in Bridge; extra = impostazioni del sito nel config; files = file in più nella cartella
const BR={
 crazygames:{pid:'crazy_games',url:'https://developer.crazygames.com',note:'Registrati come sviluppatore, «Submit game» e carica lo zip. CrazyGames vuole: pubblico 13+, caricamento sotto 5 secondi, gioco che tiene 20+ minuti. Lo SDK di CrazyGames lo carica Bridge da solo.'},
 poki:{pid:'poki',url:'https://developers.poki.com',note:'Poki seleziona i giochi: compila la richiesta su developers.poki.com. Di solito vuole l\'esclusiva sul web (anche 5 anni) e potrebbe rifiutare un gioco già pubblicato altrove. Gli acquisti con soldi veri non compaiono (Poki non li ha).'},
 gamedistribution:{pid:'game_distribution',url:'https://gamedistribution.com/developers',extra:{gameId:DA+'_GAME_ID'},need:'game_distribution.gameId',note:'Crea il gioco nel pannello di GameDistribution: ti dà un «Game ID». Mettilo in playgama-bridge-config.json al posto di '+DA+'_GAME_ID, poi ricomprimi la cartella e caricala.'},
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
 writeFileSync(d+'/index.html',html.replace(CDN,'<script src="playgama-bridge.js" onerror="window.__bridgeFail=1"></script>\n'));
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
site('gamemonetize',d=>{base(d);writeFileSync(d+'/index.html',html.replace(CDN,GM));
 writeFileSync(d+'/LEGGIMI.txt',LEGGIMI('GameMonetize','https://gamemonetize.com','Registrati come sviluppatore, crea il gioco in «Game Management» e copia il «Game ID». Poi clicca «Verify Game» e «Request activation». GameMonetize ha solo video a schermo intero: il video premio usa lo stesso annuncio e dà il premio quando finisce.','il Game ID in index.html (cerca «'+DA+'_GAME_ID»)'))});

// Versione web senza SDK: niente pubblicità, salvataggio nel browser
const WEB={itchio:['itch.io','https://itch.io/game/new','Crea il gioco, scegli «HTML» come tipo, carica lo zip e spunta «This file will be played in the browser». Imposta la finestra (es. 1280×720, con pulsante schermo intero e «mobile friendly»). Su itch.io si guadagna solo con donazioni o vendite.'],
 newgrounds:['Newgrounds','https://www.newgrounds.com/projects/games','Crea un progetto «Game», carica lo zip come HTML5. Newgrounds condivide con te parte delle sue pubblicità.'],
 armorgames:['Armor Games','https://armorgames.com/contact','Armor Games non ha un caricamento libero: scrivi proponendo il gioco (link GitHub Pages + questo zip) per una sponsorizzazione.'],
 gamepix:['GamePix','https://www.gamepix.com','Registrati come sviluppatore GamePix e invia il gioco: integrano loro il loro SDK. Se ti chiedono di integrarlo tu, dimmelo e preparo una versione apposta.']};
for(const [nome,[n,url,note]] of Object.entries(WEB))site(nome,d=>{base(d);writeFileSync(d+'/index.html',html.replace(CDN,''));writeFileSync(d+'/LEGGIMI.txt',LEGGIMI(n,url,note))});

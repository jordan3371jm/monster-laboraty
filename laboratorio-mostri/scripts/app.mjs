// ---- App per Google Play e App Store (Capacitor): cd app && npm run sync ----
// Parte dal build di sempre (dist) e crea app/www: niente Playgama Bridge (nelle app non funziona), al suo posto un adattatore
// con la forma di window.bridge sopra i plugin nativi: AdMob (video premio e interstitial, con il consenso GDPR di Google)
// e Preferences (salvataggio nel telefono). Acquisti con soldi veri e classifiche non ci sono: il Pass si sblocca con i video.
import {cpSync,existsSync,readFileSync,rmSync,writeFileSync} from 'node:fs';

// ID delle pubblicità (da AdMob → App → Unità pubblicitarie). Finché restano quelli di prova di Google l'app mostra annunci di prova:
// vanno bene per i test, ma PRIMA della pubblicazione vanno sostituiti con i tuoi (e l'ID app in android/…/AndroidManifest.xml e ios/…/Info.plist).
const ADS={
 android:{i:'ca-app-pub-3940256099942544/1033173712',r:'ca-app-pub-3940256099942544/5224354917'},
 ios:{i:'ca-app-pub-3940256099942544/4411468910',r:'ca-app-pub-3940256099942544/1712485313'},
};
const CDN=/<!-- Playgama Bridge dal CDN[^\n]*\n<script src="https:\/\/bridge\.playgama\.com[^\n]*<\/script>\n?/;
if(!existsSync('dist/index.html'))throw new Error('Prima: npm run build');
const html=readFileSync('dist/index.html','utf8');if(!CDN.test(html))throw new Error('script del Bridge non trovato in dist/index.html');

const APP=`<script>
// App (Capacitor): adattatore con la forma di Playgama Bridge (window.bridge) sopra i plugin nativi AdMob e Preferences
(function(){var L={},C=window.Capacitor,P=C&&C.Plugins||{},A=P.AdMob,PR=P.Preferences,ready=false,cur=null,got=false,lastI=0,pre={};
var ID=${JSON.stringify(ADS)}[C&&C.getPlatform&&C.getPlatform()==='ios'?'ios':'android'];
function on(k,f){(L[k]=L[k]||[]).push(f)}function emit(k,v){(L[k]||[]).forEach(function(f){try{f(v)}catch(e){}})}
// annuncio pronto in anticipo, così il video parte subito; se non si carica si riprova dopo 30 secondi
function prep(k){if(!A||!ready||pre[k])return;pre[k]=(k==='r'?A.prepareRewardVideoAd({adId:ID.r}):A.prepareInterstitial({adId:ID.i}))
 .catch(function(){pre[k]=null;setTimeout(function(){prep(k)},30000);throw new Error('load')})}
function end(st){var k=cur;cur=null;if(!k)return;pre[k]=null;emit(k==='r'?'rewarded_state_changed':'interstitial_state_changed',st);prep(k)}
function show(k){var e=k==='r'?'rewarded_state_changed':'interstitial_state_changed';
 if(cur||!A||!ready){if(k==='r')emit(e,'failed');return Promise.resolve()}
 cur=k;got=false;emit(e,'opened');prep(k);
 return pre[k].then(function(){return k==='r'?A.showRewardVideoAd():A.showInterstitial()}).catch(function(){end(k==='r'?'failed':'closed')})}
if(A){A.addListener('onRewardedVideoAdReward',function(){got=true});
 A.addListener('onRewardedVideoAdDismissed',function(){if(cur!=='r')return;if(got)emit('rewarded_state_changed','rewarded');end(got?'closed':'failed')});
 A.addListener('onRewardedVideoAdFailedToShow',function(){if(cur==='r')end('failed')});
 A.addListener('interstitialAdDismissed',function(){if(cur==='i'){lastI=Date.now();end('closed')}});
 A.addListener('interstitialAdFailedToShow',function(){if(cur==='i')end('closed')})}
var priv=function(){if(A)A.showPrivacyOptionsForm().catch(function(){})};priv.needed=false;
window.bridge={platform:{id:'app',language:navigator.language||'en',payload:'',isAudioEnabled:true,on:on,sendMessage:function(){return Promise.resolve()}},
 advertisement:{isAdvancedBannersSupported:false,rewardedState:'closed',interstitialState:'closed',on:on,
  // interstitial solo ai cambi di schermata e al massimo uno ogni 2 minuti (quello ogni 50 unioni cadrebbe in mezzo al gioco)
  showInterstitial:function(place){if(place==='merge'||Date.now()-lastI<120000)return Promise.resolve();return show('i')},
  showRewarded:function(){return show('r')},showAdvancedBanners:function(){},hideAdvancedBanners:function(){}},
 storage:{get:function(k){if(PR)return PR.get({key:k}).then(function(r){return r&&r.value||null},function(){return null});try{return Promise.resolve(localStorage.getItem(k))}catch(e){return Promise.resolve(null)}},
  set:function(k,v){if(PR)return PR.set({key:k,value:String(v)});try{localStorage.setItem(k,v)}catch(e){}return Promise.resolve()}},
 payments:{isSupported:false},notifications:{isSupported:false},player:{isAuthorizationSupported:false,isAuthorized:false},social:{},leaderboards:{type:'not_available'},
 privacyOptions:priv,
 // il gioco parte subito; pubblicità e modulo del consenso (UE/UK) si preparano in parallelo
 initialize:function(){if(A)A.initialize({}).then(function(){return A.requestConsentInfo()}).then(function(c){
   priv.needed=c&&c.privacyOptionsRequirementStatus==='REQUIRED';
   if(c&&c.isConsentFormAvailable&&c.status==='REQUIRED')return A.showConsentForm()}).catch(function(){})
  .then(function(){ready=true;prep('r');prep('i')});return Promise.resolve()}};
})();
</script>
`;

const W='app/www';rmSync(W,{recursive:true,force:true});cpSync('dist',W,{recursive:true});
rmSync(W+'/playgama-bridge-config.json',{force:true});
writeFileSync(W+'/index.html',html.replace(CDN,APP));
console.log('✓ app/www pronto (pubblicità: '+(ADS.android.i.includes('3940256099942544')?'ID DI PROVA di Google':'ID veri')+')');

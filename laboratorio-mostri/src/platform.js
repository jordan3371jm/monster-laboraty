import {AU} from './audio.js';
import {R,S} from './core/state.js';
import {give,incBase} from './game/economy.js';
import {addT,ch,psBuy,psCheck} from './game/meta.js';
const passOn=()=>{psCheck();return!!ch().ps.prem};

// ---- Playgama Bridge: tutte le chiamate alla piattaforma passano da qui ----
// Senza Bridge (in locale, o se non si è inizializzato) ogni funzione non fa nulla e restituisce un valore neutro.
const B=()=>R.inited&&window.bridge?window.bridge:null;
const safe=(f,d)=>{try{const b=B();return b?f(b):d}catch(e){return d}};
const later=p=>{try{Promise.resolve(p).catch(()=>{})}catch(e){}};
const msg=(m,o)=>safe(b=>later(b.platform.sendMessage(m,o)));

// gameplay_started / gameplay_stopped: si gioca quando la pagina è visibile, non in pausa e senza pubblicità aperte
let play=null;
function syncPlay(){const on=!!(window.__ready&&!R.PZ&&!AU.ad&&!document.hidden);if(on===play)return;play=on;msg(on?'gameplay_started':'gameplay_stopped')}

// Livelli di battaglia: solo il livello record (il farm e le ripetizioni dopo una sconfitta non mandano messaggi doppi)
const lv={s:0,f:0};
function levelStart(s){if(lv.s===s)return;lv.s=s;lv.f=0;msg('level_started',{level:s,world:S.wd})}
function levelDone(s){msg('level_completed',{level:s,world:S.wd});lbScore()}
function levelFail(s){if(lv.f===s)return;lv.f=s;msg('level_failed',{level:s,world:S.wd})}

// Trofei → obiettivi della piattaforma (dove esistono) e messaggio player_got_achievement
function achieve(id){msg('player_got_achievement',{achievement:id});safe(b=>{const a=b.achievements;if(a&&a.isSupported!==false&&a.unlock)later(a.unlock(id))})}

// Classifica «best_stage» (livello record), solo sulle piattaforme che ne hanno una
let lbLast=0;
function lbScore(){safe(b=>{const l=b.leaderboards;if(!l||!l.type||l.type==='not_available'||S.bs<=lbLast)return;lbLast=S.bs;later(l.setScore('best_stage',S.bs))})}

// Analytics della piattaforma (oltre a quelle salvate nel gioco, vedi analytics.js)
function aSend(ev,d){safe(b=>{if(b.analytics&&typeof b.analytics.send==='function')b.analytics.send(ev,d&&typeof d==='object'?d:{})})}

// ---- Banner (advanced banners, posizioni in playgama-bridge-config.json) ----
// Solo dove non coprono il gioco: in orizzontale (PC, tablet) nell'angolo in basso a sinistra, sotto la barra laterale che lì è vuota;
// in verticale solo dentro i pannelli (Potenziamenti, Missioni…), in fondo, dove il CSS lascia lo spazio (#app.bnm).
// Niente banner durante il tutorial né per chi ha comprato «Niente pubblicità». Durante video e interstitial li nasconde l'SDK.
let bnr=null;R.bnr=false;
function banner(menu){const want=S.tut<3||S.iap.na?'':menu?'menu':'main';if(want===bnr)return;bnr=want;
 safe(b=>{const a=b.advertisement;if(!a||!a.isAdvancedBannersSupported)return;
  if(!a.__bl&&a.on){a.__bl=1;a.on('advanced_banners_state_changed',s=>{R.bnr=s==='shown'})}
  if(want)a.showAdvancedBanners(want);else{a.hideAdvancedBanners();R.bnr=false}})}
const bannerMenu=()=>bnr==='menu'&&R.bnr;

// ---- Acquisti nel gioco ----
// Gli id devono esistere anche nel pannello sviluppatore di Playgama e in playgama-bridge-config.json («payments»).
// perm = acquisto permanente (si ripristina a ogni avvio con getPurchases); gli altri si consumano dopo la consegna.
const PROD={
 starter_pack:{ic:'🎁',t:30,e:30,h:4,perm:'st'},
 tickets_10:{ic:'🎫',t:10},tickets_60:{ic:'🎫',t:60},tickets_150:{ic:'🎫',t:150},
 ess_10:{ic:'🔮',e:10},ess_60:{ic:'🔮',e:60},ess_150:{ic:'🔮',e:150},
 coins_12h:{ic:'🪙',h:12},coins_24h:{ic:'💰',h:24},income_x2:{ic:'📈',perm:'x2'},
 pass_premium:{ic:'🎟️',pass:1}}; // pass: Premium del Pass stagionale per la stagione in corso (si ricompra a ogni stagione)
// (S.iap.na, il vecchio «Niente pubblicità», non è più in vendita ma resta valido per chi lo avesse)
const payOn=()=>safe(b=>!!(b.payments&&b.payments.isSupported),false);
async function catalog(){if(!payOn())return[];try{const c=await B().payments.getCatalog();return(Array.isArray(c)?c:[]).filter(p=>p&&PROD[p.id]&&p.price!=null&&!/undefined|NaN/.test(String(p.price)))}catch(e){return[]}} // solo i prodotti con un prezzo vero (creati nel pannello)
const owned=id=>{const p=PROD[id];return!!(p&&(p.perm&&S.iap[p.perm]||p.pass&&passOn()))};
// Consegna: i permanenti una volta sola (flag in S.iap), i consumabili una volta per ordine (S.iap.got evita doppioni)
function grant(id,pur){const p=PROD[id];if(!p)return null;
 if(p.perm){if(S.iap[p.perm])return null;S.iap[p.perm]=1}
 else{const k=pur&&(pur.orderId||pur.externalId||pur.purchaseToken);if(k){if(S.iap.got.includes(String(k)))return null;S.iap.got.push(String(k));if(S.iap.got.length>60)S.iap.got.shift()}}
 const c=p.h?Math.max(incBase()*3600*p.h,1000*p.h):0;give(c,p.e||0);addT(p.t||0);if(p.pass)psBuy();return{...p,c}}
async function buy(id){if(!payOn()||!PROD[id]||owned(id))return null;
 const pur=await B().payments.purchase(id);const g=grant(id,pur||{});if(!PROD[id].perm)later(B().payments.consumePurchase(id));return g}
// All'avvio: ripristina i permanenti e consegna i consumabili rimasti in sospeso (pagati ma non consumati)
async function restore(){if(!payOn())return[];let list=[];try{list=await B().payments.getPurchases()}catch(e){return[]}
 const out=[];for(const pur of Array.isArray(list)?list:[]){const id=pur&&pur.id;if(!PROD[id])continue;const g=grant(id,pur);if(g)out.push(g);if(!PROD[id].perm)later(B().payments.consumePurchase(id))}
 return out}

// ---- Notifiche (Bridge «notifications»): la piattaforma le mostra quando il giocatore è uscito dal gioco ----
// Oggi le supporta solo MSN (su Playgama e quasi ovunque isSupported è false): senza supporto non succede nulla e restano
// la campanella e il pallino dentro il gioco. Gli id sono mappati nel config (notifications: exp_ready, egg_ready).
// Annullare non è supportato da nessuna piattaforma: si programmano solo notifiche sicure (fine di un timer appena partito).
const notifOn=()=>safe(b=>!!(b.notifications&&b.notifications.isSupported),false);
function notify(id,title,description,delaySec){if(!notifOn())return;safe(b=>later(b.notifications.schedule({id,title:String(title).slice(0,60),description:String(description).slice(0,200),delaySeconds:Math.max(60,Math.min(604800,Math.round(delaySec))),payload:id})))}
// Il gioco è stato aperto da una notifica? (platform.payload) → id della notifica o ''
const launchPayload=()=>safe(b=>String(b.platform&&b.platform.payload||''),'');

// ---- Account e social ----
const player=()=>safe(b=>{const p=b.player;return p?{can:!!p.isAuthorizationSupported,on:!!p.isAuthorized,name:p.name||''}:null},null);
const authorize=()=>safe(b=>Promise.resolve(b.player.authorize()),null)||Promise.reject();
const SOC=[['share','isShareSupported'],['addToHomeScreen','isAddToHomeScreenSupported'],['addToFavorites','isAddToFavoritesSupported'],['rate','isRateSupported'],['inviteFriends','isInviteFriendsSupported'],['joinCommunity','isJoinCommunitySupported']];
const socials=()=>safe(b=>b.social?SOC.filter(([f,k])=>b.social[k]&&typeof b.social[f]==='function').map(([f])=>f):[],[]);
const social=(f,o)=>safe(b=>Promise.resolve(b.social[f](o)),null)||Promise.reject();

export {notify,notifOn,launchPayload,banner,bannerMenu,msg,syncPlay,levelStart,levelDone,levelFail,achieve,lbScore,aSend,PROD,payOn,catalog,owned,buy,restore,grant,player,authorize,socials,social};

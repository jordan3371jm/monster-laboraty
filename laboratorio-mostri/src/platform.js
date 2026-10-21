import {AU} from './audio.js';
import {R,S} from './core/state.js';
import {give,incBase} from './game/economy.js';
import {addT} from './game/meta.js';

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

// ---- Acquisti nel gioco ----
// Gli id devono esistere anche nel pannello sviluppatore di Playgama e in playgama-bridge-config.json («payments»).
// perm = acquisto permanente (si ripristina a ogni avvio con getPurchases); gli altri si consumano dopo la consegna.
const PROD={
 tickets_10:{ic:'🎫',t:10},tickets_60:{ic:'🎫',t:60},ess_10:{ic:'🔮',e:10},coins_4h:{ic:'🪙',h:4},
 starter_pack:{ic:'🎁',t:20,e:5,h:1,perm:'st'},income_x2:{ic:'💰',perm:'x2'},no_ads:{ic:'🚫',perm:'na'}};
const payOn=()=>safe(b=>!!(b.payments&&b.payments.isSupported),false);
async function catalog(){if(!payOn())return[];try{const c=await B().payments.getCatalog();return(Array.isArray(c)?c:[]).filter(p=>p&&PROD[p.id])}catch(e){return[]}}
const owned=id=>{const p=PROD[id];return!!(p&&p.perm&&S.iap[p.perm])};
// Consegna: i permanenti una volta sola (flag in S.iap), i consumabili una volta per ordine (S.iap.got evita doppioni)
function grant(id,pur){const p=PROD[id];if(!p)return null;
 if(p.perm){if(S.iap[p.perm])return null;S.iap[p.perm]=1}
 else{const k=pur&&(pur.orderId||pur.externalId||pur.purchaseToken);if(k){if(S.iap.got.includes(String(k)))return null;S.iap.got.push(String(k));if(S.iap.got.length>60)S.iap.got.shift()}}
 const c=p.h?Math.max(incBase()*3600*p.h,1000*p.h):0;give(c,p.e||0);addT(p.t||0);return{...p,c}}
async function buy(id){if(!payOn()||!PROD[id]||owned(id))return null;
 const pur=await B().payments.purchase(id);const g=grant(id,pur||{});if(!PROD[id].perm)later(B().payments.consumePurchase(id));return g}
// All'avvio: ripristina i permanenti e consegna i consumabili rimasti in sospeso (pagati ma non consumati)
async function restore(){if(!payOn())return[];let list=[];try{list=await B().payments.getPurchases()}catch(e){return[]}
 const out=[];for(const pur of Array.isArray(list)?list:[]){const id=pur&&pur.id;if(!PROD[id])continue;const g=grant(id,pur);if(g)out.push(g);if(!PROD[id].perm)later(B().payments.consumePurchase(id))}
 return out}

// ---- Account e social ----
const player=()=>safe(b=>{const p=b.player;return p?{can:!!p.isAuthorizationSupported,on:!!p.isAuthorized,name:p.name||''}:null},null);
const authorize=()=>safe(b=>Promise.resolve(b.player.authorize()),null)||Promise.reject();
const SOC=[['share','isShareSupported'],['addToHomeScreen','isAddToHomeScreenSupported'],['addToFavorites','isAddToFavoritesSupported'],['rate','isRateSupported'],['inviteFriends','isInviteFriendsSupported'],['joinCommunity','isJoinCommunitySupported']];
const socials=()=>safe(b=>b.social?SOC.filter(([f,k])=>b.social[k]&&typeof b.social[f]==='function').map(([f])=>f):[],[]);
const social=(f,o)=>safe(b=>Promise.resolve(b.social[f](o)),null)||Promise.reject();

export {msg,syncPlay,levelStart,levelDone,levelFail,achieve,lbScore,aSend,PROD,payOn,catalog,owned,buy,restore,grant,player,authorize,socials,social};

import {BN,MAXT} from '../data/config.js';
import {S,R,def,KEEP} from '../core/state.js';

// ---- Iniezione di dipendenza (niente import circolare con game/timers.js) ----
// timers.js, appena caricato, chiama setEvMul() e passa a economy il moltiplicatore dei «motivi per tornare»
// (evento settimanale + serie lunga + ordine appena completato). Il nome è unico perché gli import circolari
// ES si risolvono in due fasi: economy.js viene eseguito prima di timers.js, quindi qui dentro non si può
// importare nulla da timers — solo riceverlo.
// Se economy viene usata da sola (test/simulazioni), il valore di riserva ×1 mantiene il comportamento classico.
let _evMul=()=>1;
// Altri ganci (game/meta.js): guadagni dei campioni/equipaggiamento/album, intervallo dell'incubatrice. Da soli valgono ×1.
const HK={inc:()=>1,egg:()=>1},setHook=(k,f)=>{HK[k]=f};
const setEvMul=f=>{_evMul=f||(()=>1)};

// Bonus delle Essenze: +10% ciascuna fino a ESS_SOFT, poi crescita a potenza (ESS_EXP<1) così i numeri non esplodono.
const ESS_SOFT=50,ESS_EXP=.6;
const essBonus=e=>e<=ESS_SOFT?.1*e:.1*ESS_SOFT*Math.pow(e/ESS_SOFT,ESS_EXP);
const essMult=e=>1+essBonus(e);
// Guadagni offline: parte da 25% e sale con «Sonno profondo» e «Sonno lungo», senza mai superare il gioco attivo.
const offRate=()=>.25+OFF_UP*S.up.o+PK_O*S.pk.o;
// Celle del laboratorio: BN iniziali + 1 per livello di «Laboratorio ampliato»
const slots=()=>BN+S.up.c,freeCell=()=>{const n=slots();for(let i=0;i<n;i++)if(!S.g[i])return i;return -1};
// Moltiplicatore dei guadagni. Gli ultimi fattori vengono dai «motivi per tornare» (moduli che li applicano):
// evento settimanale (elemento in festa + campione tenuto in laboratorio), serie giornaliera lunga, boost x2.
const mult=()=>(1+LAB_UP*S.up.l)*essMult(S.essT)*(1+.03*(S.bs-1))*(1+.01*trN())*(1+PK_G*S.pk.g)*(1+PKR_X*(S.pk.x||0))
 *_evMul()*HK.inc()*(Date.now()<S.boost?2:1)*(S.iap&&S.iap.x2?2:1); // ultimo: acquisto «Guadagni ×2»
const val=t=>.5*Math.pow(2.4,t-1);
// Variante dorata (S.gv[i]=1): quel mostro rende GOLD volte tanto
const GOLD=3,inc=()=>S.g.reduce((s,t,i)=>s+(t?val(t)*(S.gv&&S.gv[i]?GOLD:1):0),0)*mult();
// prima partita (nessuna Evocazione oscura): il prezzo delle uova sale più piano, così i primi minuti non si bloccano
const spCost=()=>Math.floor(10*Math.pow(2,S.pk.s)*Math.pow(S.ach&&S.ach.pr?1.07:1.06,S.sp)*Math.max(.01,1-DISC_UP*S.up.d)*Math.pow(PK_E,S.pk.e||0));
// Potenziamenti a monete: tanti livelli piccoli e costi che salgono piano, così le monete restano utili per tutta la partita.
// l Guadagni +5% · d Sconto uova -0,5% (fino a -99%) · o Sonno profondo +0,5% offline (fino a +200%)
// a Velocità di unione e f Incubatrice automatica: da 60s a 5s, -0,1s a livello · c Laboratorio ampliato: +1 cella (15 livelli)
// m Livello di unione: +1 al livello massimo dell'unione automatica · n Laboratorio notturno (vedi offAutoInt)
const LAB_UP=.05,DISC_UP=.005,OFF_UP=.005,AUTO_T0=60,AUTO_STEP=.1,AUTO_MIN=5,AUTO_MAX=(AUTO_T0-AUTO_MIN)/AUTO_STEP;
const UP=[{k:'l',max:1000,cost:l=>Math.floor(50*Math.pow(1.27,l))},{k:'d',max:198,cost:l=>Math.floor(100*Math.pow(1.16,l))},{k:'o',max:400,cost:l=>Math.floor(150*Math.pow(1.09,l))},{k:'a',max:AUTO_MAX,am:1,cost:l=>Math.floor(250*Math.pow(1.055,l))},{k:'c',max:15,cost:l=>Math.floor(5000*Math.pow(4.5,l))},
 {k:'f',max:AUTO_MAX,ae:1,cost:l=>Math.floor(5000*Math.pow(1.06,l))},{k:'m',max:MAXT-2,am:1,cost:l=>Math.floor(5000*Math.pow(3.6,l))},
 {k:'n',max:1681,cost:l=>Math.floor(3000*Math.pow(1.015,l))}]; // f: Incubatrice automatica (uova gratis a intervalli, vedi eggInt)
// a, m: potenziamenti dell'Unione automatica (am: si vedono solo dopo averla sbloccata con AM_COST Essenze, per sempre in S.am).
// Ogni amInt() secondi si uniscono due mostri uguali qualsiasi (la coppia più bassa presente), fino al livello amMax().
// Il massimo parte dal livello delle uova evocate (anche con «Uova antiche») e sale di 1 a livello.
const autoT=l=>Math.max(AUTO_MIN,AUTO_T0-AUTO_STEP*(l||0));
const AM_COST=5,amInt=()=>autoT(S.up.a),amMax=()=>Math.min(MAXT-1,1+S.pk.s+(S.up.m||0));
// Video «Unione 5 minuti» (finché l'unione automatica non è sbloccata): una coppia ogni AMV_INT secondi, a qualsiasi livello
const AMV_INT=10,AMV_MS=5*60e3,AD_MERGES=50; // AD_MERGES: ogni 50 unioni (a mano o automatiche) parte un interstitial
// ---- Albero delle Essenze ----
// Radici: tanti livelli piccoli con un tetto (effetto per livello · totale): s Uova antiche +1 livello delle uova (12 livelli, costo che sale molto),
// a Abilità rapide -1% ricarica (-75%) · o Sonno lungo +1% offline (+100%) · g Avidità +5% guadagni (+500%) · b Bottino dei boss +5% premio dei boss (+500%)
// i Incubatrice -1% tempo delle uova a tempo (-50%) · e Mercato nero -1,5% costo uova (composto) · v Richiamo spettrale -1% attesa eventi (-50%) · w Cesta dei timer -1% tempi (-60%)
const PK_A=.01,PK_O=.01,PK_G=.05,PK_B=.05,PK_I=.01,PK_E=.985,PK_V=.01,PK_W=.01;
const pkc=(a,g)=>l=>Math.ceil(a*Math.pow(g,l));
const PK=[{k:'s',ic:'🥚',max:12,cost:pkc(2,2.6)},{k:'g',ic:'💰',max:100,cost:pkc(1,1.02)},{k:'o',ic:'🌙',max:100,cost:pkc(1,1.06)},{k:'a',ic:'✨',max:75,cost:pkc(2,1.07)},{k:'b',ic:'👑',max:100,cost:pkc(2,1.06)},
 {k:'i',ic:'🔥',max:50,cost:pkc(2,1.08)},{k:'e',ic:'🛒',max:100,cost:pkc(2,1.07)},{k:'v',ic:'👻',max:50,cost:pkc(2,1.08)},{k:'w',ic:'🧺',max:60,cost:pkc(2,1.08)}];
// Rami infiniti: nessun limite di livelli, il costo sale piano (x +2% guadagni, t +1% attacco, h +1% vita)
const PKR_X=.02,PKR_T=.01,PKR_H=.01,PKR=[{k:'x',ic:'⚗️',max:1e9},{k:'t',ic:'🗡️',max:1e9},{k:'h',ic:'🛡️',max:1e9}],pkrCost=l=>Math.ceil(3*Math.pow(1.1,l))+l;
const pkCan=()=>PK.some(p=>S.pk[p.k]<p.max&&S.ess>=p.cost(S.pk[p.k]))||PKR.some(p=>S.ess>=pkrCost(S.pk[p.k]||0));
// Incubatrice automatica: secondi tra un uovo gratis e l'altro (0 = spenta). Le uova gratis non alzano il prezzo di quelle comprate.
// Si sblocca per sempre con AE_COST Essenze (S.ae): da lì un uovo ogni EGG_T0 secondi, -0,5s per livello di «Incubatrice automatica» (fino a 5s).
// «Laboratorio notturno»: a gioco chiuso fa nascere un uovo e unisce due mostri ogni offAutoInt() secondi.
// Livello 1: ogni 30 minuti; ogni livello toglie 1 secondo, fino a 2 minuti (livello 1681). Livello 0: spento.
const OFF_AUTO=1800,OFF_MIN=120,offAutoInt=()=>S.up.n?Math.max(OFF_MIN,OFF_AUTO-(S.up.n-1)):0;
const AE_COST=5,EGG_T0=AUTO_T0,eggInt=()=>S.ae?autoT(S.up.f)*HK.egg():0;
const trN=()=>R.trC,spT=()=>1+S.pk.s; // livello delle uova evocate
const earn=c=>{S.c+=c;S.run+=c;S.lt+=c};
// Guadagno al secondo senza il boost x2: base dei premi «N minuti di guadagni» (forzieri, missioni, collezione…) e dei guadagni offline,
// che altrimenti raddoppierebbero solo perché il boost è attivo nel momento in cui si riscuote (o per tutte le ore di assenza).
const incBase=()=>inc()/(Date.now()<S.boost?2:1);
const rBase=()=>Math.max(incBase()*300,150),give=(c,e)=>{earn(c);if(e){S.ess+=e;S.essT+=e}};
const dayNum=()=>Math.floor((Date.now()-new Date().getTimezoneOffset()*60000)/864e5);
// Monete della partita necessarie per la prima Essenza: PG. Solo la PRIMA Evocazione oscura usa la soglia più bassa PG1
// (le guide consigliano il primo prestigio entro 10-15 minuti; prima arrivava dopo ~30 col gioco ottimale). Le successive restano uguali.
const PG1=35000,PG=200000,pgN=()=>S.ach&&S.ach.pr?PG:PG1,pgain=()=>Math.floor(Math.sqrt(S.run/pgN()));
// Conviene l'Evocazione oscura? Sì quando le Essenze che otterresti alzano i guadagni di almeno il 25% (PR_OK)
const PR_OK=1.25,prRatio=()=>essMult(S.essT+pgain())/essMult(S.essT),prWorth=()=>pgain()>=1&&prRatio()>=PR_OK;
// Unisce a coppie tutti i mostri uguali (dal livello più basso): ritorna le unioni fatte come {i: cella, t: nuovo livello}.
// gv (facoltativo): varianti dorate, il risultato è dorato solo se lo sono entrambi
// max: livello più alto che si può unire; n: numero massimo di unioni (Unione automatica = 1 ogni amInt() secondi)
function mergePairs(g,gv,max=MAXT-1,n=Infinity){const out=[];for(let t=1;t<=Math.min(max,MAXT-1);t++){const ix=[];g.forEach((v,i)=>{if(v===t)ix.push(i)});
 for(let k=0;k+1<ix.length&&out.length<n;k+=2){g[ix[k]]=t+1;g[ix[k+1]]=0;if(gv){gv[ix[k]]=gv[ix[k]]&&gv[ix[k+1]]?1:0;gv[ix[k+1]]=0}out.push({i:ix[k],t:t+1})}}return out}
// Stato nuovo dopo l'Evocazione oscura: azzera la partita e tiene solo ciò che è in KEEP, più le Essenze ottenute.
function prestigeState(old,p){const x=def();KEEP.forEach(k=>x[k]=old[k]);x.ord={...old.ord,list:[],nx:[]}; // laboratorio azzerato: gli ordini aperti non sarebbero più realizzabili (grado e statistiche restano)
 x.ess=old.ess+p;x.essT=old.essT+p;x.ach.pr++;
 const s0=1+x.pk.s;x.g[0]=x.g[1]=s0;for(let t=1;t<=s0;t++)x.disc[t-1]=1; // perk «Uova antiche»
 return x}
export {autoT,AUTO_MAX,PK_A,PK_O,PK_G,PK_B,PK_I,PK_E,PK_V,PK_W,PKR_X,PKR_T,PKR_H,pkCan,PR_OK,prRatio,prWorth,OFF_AUTO,offAutoInt,LAB_UP,DISC_UP,OFF_UP,AE_COST,EGG_T0,AMV_INT,AMV_MS,AD_MERGES,AM_COST,amInt,amMax,PG1,pgN,GOLD,setHook,eggInt,incBase,essBonus,essMult,offRate,slots,freeCell,PG,mult,val,inc,spCost,UP,PK,PKR,pkrCost,trN,spT,earn,rBase,give,dayNum,pgain,mergePairs,prestigeState,setEvMul};

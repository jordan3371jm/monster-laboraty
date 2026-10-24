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
const offRate=()=>.25+OFF_UP*S.up.o+.04*S.pk.o;
// Celle del laboratorio: BN iniziali + 1 per livello di «Laboratorio ampliato»
const slots=()=>BN+S.up.c,freeCell=()=>{const n=slots();for(let i=0;i<n;i++)if(!S.g[i])return i;return -1};
// Moltiplicatore dei guadagni. Gli ultimi fattori vengono dai «motivi per tornare» (moduli che li applicano):
// evento settimanale (elemento in festa + campione tenuto in laboratorio), serie giornaliera lunga, boost x2.
const mult=()=>(1+LAB_UP*S.up.l)*essMult(S.essT)*(1+.03*(S.bs-1))*(1+.01*trN())*(1+.2*S.pk.g)*(1+.04*(S.pk.x||0))
 *_evMul()*HK.inc()*(Date.now()<S.boost?2:1)*(S.iap&&S.iap.x2?2:1); // ultimo: acquisto «Guadagni ×2»
const val=t=>.5*Math.pow(2.4,t-1);
// Variante dorata (S.gv[i]=1): quel mostro rende GOLD volte tanto
const GOLD=3,inc=()=>S.g.reduce((s,t,i)=>s+(t?val(t)*(S.gv&&S.gv[i]?GOLD:1):0),0)*mult();
// prima partita (nessuna Evocazione oscura): il prezzo delle uova sale più piano, così i primi minuti non si bloccano
const spCost=()=>Math.floor(10*Math.pow(2,S.pk.s)*Math.pow(S.ach&&S.ach.pr?1.07:1.06,S.sp)*Math.pow(1-DISC_UP,S.up.d)*Math.pow(.98,S.pk.e||0));
// Potenziamenti a monete. Laboratorio, Sconto uova e Sonno profondo danno poco per livello ma hanno tanti livelli economici:
// le monete restano utili per tutta la partita invece di finire i potenziamenti in fretta.
const LAB_UP=.05,DISC_UP=.02,OFF_UP=.02;
const UP=[{k:'l',max:500,cost:l=>Math.floor(50*Math.pow(1.3,l))},{k:'d',max:40,cost:l=>Math.floor(100*Math.pow(1.55,l))},{k:'o',max:25,cost:l=>Math.floor(150*Math.pow(1.6,l))},{k:'a',max:20,am:1,cost:l=>Math.floor(250*Math.pow(1.5,l))},{k:'c',max:8,cost:l=>Math.floor(1500*Math.pow(3.5,l))},
 {k:'f',max:50,ae:1,cost:l=>Math.floor(5000*Math.pow(1.42,l))},{k:'m',max:MAXT-2,am:1,cost:l=>Math.floor(400*Math.pow(2.8,l))},
 {k:'n',max:15,off:1,cost:l=>Math.floor(3000*Math.pow(1.7,l))}]; // n: «Laboratorio notturno» (unione e incubatrice automatiche a gioco chiuso più veloci) // f: Incubatrice automatica (uova gratis a intervalli, vedi eggInt)
// a, m: potenziamenti dell'Unione automatica (am: si vedono solo dopo averla sbloccata con AM_COST Essenze, per sempre in S.am).
// Ogni amInt() secondi si uniscono due mostri uguali qualsiasi (la coppia più bassa presente), fino al livello amMax():
// 15s → 5s (-0,5s a livello). Il massimo parte dal livello delle uova evocate (anche con «Uova antiche») e sale di 1 a livello.
const AM_COST=5,amInt=()=>Math.max(5,15-.5*S.up.a),amMax=()=>Math.min(MAXT-1,1+S.pk.s+(S.up.m||0));
// Video «Unione 5 minuti» (finché l'unione automatica non è sbloccata): una coppia ogni AMV_INT secondi, a qualsiasi livello
const AMV_INT=10,AMV_MS=5*60e3,AD_MERGES=50; // AD_MERGES: ogni 50 unioni (a mano o automatiche) parte un interstitial
const PK=[{k:'s',ic:'🥚',max:12,cost:[2,4,8,16,32,64,128,256,512,1024,2048,4096]},{k:'a',ic:'✨',max:5,cost:[2,3,5,8,12]},{k:'o',ic:'🌙',max:5,cost:[1,2,3,5,8]},{k:'g',ic:'💰',max:8,cost:[1,2,3,4,6,8,11,15]},{k:'b',ic:'👑',max:4,cost:[2,3,5,8]},
 {k:'i',ic:'🔥',max:8,cost:[2,3,4,6,8,11,15,20]}]; // Incubatrice: -4% tempi delle uova a tempo per livello
// Rami infiniti dell'albero: livelli ripetibili a costo crescente (x guadagni, t attacco, h vita, e sconto uova, v eventi più frequenti)
const PKR=[{k:'x',ic:'⚗️',max:60},{k:'t',ic:'🗡️',max:60},{k:'h',ic:'🛡️',max:60},{k:'e',ic:'🥚',max:40},{k:'v',ic:'👻',max:15},{k:'w',ic:'🧺',max:20}],pkrCost=l=>Math.ceil(3*Math.pow(1.22,l));
// Incubatrice automatica: secondi tra un uovo gratis e l'altro (0 = spenta). Le uova gratis non alzano il prezzo di quelle comprate.
// Si sblocca per sempre con AE_COST Essenze (S.ae): da lì un uovo ogni EGG_T0 secondi, -0,5s per livello di «Incubatrice automatica» (fino a 5s).
// A gioco chiuso unione e incubatrice automatiche lavorano molto più piano: un'azione ogni offAutoInt() secondi (5 minuti),
// -12s per livello di «Laboratorio notturno» fino a 2 minuti. Valgono le stesse regole (livello massimo dell'unione, celle libere).
const OFF_AUTO=300,offAutoInt=()=>Math.max(120,OFF_AUTO-12*(S.up.n||0));
const AE_COST=5,EGG_T0=30,eggInt=()=>S.ae?Math.max(5,EGG_T0-.5*S.up.f)*HK.egg():0;
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
export {PR_OK,prRatio,prWorth,OFF_AUTO,offAutoInt,LAB_UP,DISC_UP,OFF_UP,AE_COST,EGG_T0,AMV_INT,AMV_MS,AD_MERGES,AM_COST,amInt,amMax,PG1,pgN,GOLD,setHook,eggInt,incBase,essBonus,essMult,offRate,slots,freeCell,PG,mult,val,inc,spCost,UP,PK,PKR,pkrCost,trN,spT,earn,rBase,give,dayNum,pgain,mergePairs,prestigeState,setEvMul};

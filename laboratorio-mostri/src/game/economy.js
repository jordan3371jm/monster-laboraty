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
const offRate=()=>.25+.07*S.up.o+.04*S.pk.o;
// Celle del laboratorio: BN iniziali + 1 per livello di «Laboratorio ampliato»
const slots=()=>BN+S.up.c,freeCell=()=>{const n=slots();for(let i=0;i<n;i++)if(!S.g[i])return i;return -1};
// Moltiplicatore dei guadagni. Gli ultimi fattori vengono dai «motivi per tornare» (moduli che li applicano):
// evento settimanale (elemento in festa + campione tenuto in laboratorio), serie giornaliera lunga, boost x2.
const mult=()=>(1+.25*S.up.l)*essMult(S.essT)*(1+.03*(S.bs-1))*(1+.01*trN())*(1+.2*S.pk.g)*(1+.04*(S.pk.x||0))
 *_evMul()*HK.inc()*(Date.now()<S.boost?2:1);
const val=t=>.5*Math.pow(2.4,t-1);
// Variante dorata (S.gv[i]=1): quel mostro rende GOLD volte tanto
const GOLD=3,inc=()=>S.g.reduce((s,t,i)=>s+(t?val(t)*(S.gv&&S.gv[i]?GOLD:1):0),0)*mult();
const spCost=()=>Math.floor(10*Math.pow(2,S.pk.s)*Math.pow(1.07,S.sp)*Math.pow(.92,S.up.d)*Math.pow(.98,S.pk.e||0));
const UP=[{k:'l',max:99,cost:l=>Math.floor(100*Math.pow(2.2,l))},{k:'d',max:10,cost:l=>Math.floor(150*Math.pow(2.5,l))},{k:'o',max:7,cost:l=>Math.floor(200*Math.pow(2.5,l))},{k:'a',max:6,cost:l=>Math.floor(400*Math.pow(3,l))},{k:'c',max:8,cost:l=>Math.floor(1500*Math.pow(3.5,l))},
 {k:'f',max:8,cost:l=>Math.floor(1000*Math.pow(5,l))}]; // f: Incubatrice automatica (uova gratis a intervalli, vedi eggInt)
const PK=[{k:'s',ic:'🥚',max:12,cost:[2,4,8,16,32,64,128,256,512,1024,2048,4096]},{k:'a',ic:'✨',max:5,cost:[2,3,5,8,12]},{k:'o',ic:'🌙',max:5,cost:[1,2,3,5,8]},{k:'g',ic:'💰',max:8,cost:[1,2,3,4,6,8,11,15]},{k:'b',ic:'👑',max:4,cost:[2,3,5,8]},
 {k:'i',ic:'🔥',max:8,cost:[2,3,4,6,8,11,15,20]}]; // Incubatrice: -4% tempi delle uova a tempo per livello
// Rami infiniti dell'albero: livelli ripetibili a costo crescente (x guadagni, t attacco, h vita, e sconto uova, v eventi più frequenti)
const PKR=[{k:'x',ic:'⚗️',max:60},{k:'t',ic:'🗡️',max:60},{k:'h',ic:'🛡️',max:60},{k:'e',ic:'🥚',max:40},{k:'v',ic:'👻',max:15},{k:'w',ic:'🧺',max:20}],pkrCost=l=>Math.ceil(3*Math.pow(1.22,l));
// Incubatrice automatica: secondi tra un uovo gratis e l'altro (0 = spenta). Le uova gratis non alzano il prezzo di quelle comprate.
const eggInt=()=>S.up.f?30*Math.pow(.78,S.up.f-1)*HK.egg():0;
const trN=()=>R.trC,spT=()=>1+S.pk.s; // livello delle uova evocate
const earn=c=>{S.c+=c;S.run+=c;S.lt+=c};
// Guadagno al secondo senza il boost x2: base dei premi «N minuti di guadagni» (forzieri, missioni, collezione…) e dei guadagni offline,
// che altrimenti raddoppierebbero solo perché il boost è attivo nel momento in cui si riscuote (o per tutte le ore di assenza).
const incBase=()=>inc()/(Date.now()<S.boost?2:1);
const rBase=()=>Math.max(incBase()*300,150),give=(c,e)=>{earn(c);if(e){S.ess+=e;S.essT+=e}};
const dayNum=()=>Math.floor((Date.now()-new Date().getTimezoneOffset()*60000)/864e5);
// Monete della partita necessarie per la prima Essenza: PG. Solo la PRIMA Evocazione oscura usa la soglia più bassa PG1
// (le guide consigliano il primo prestigio entro 10-15 minuti; prima arrivava dopo ~30 col gioco ottimale). Le successive restano uguali.
const PG1=50000,PG=200000,pgN=()=>S.ach&&S.ach.pr?PG:PG1,pgain=()=>Math.floor(Math.sqrt(S.run/pgN()));
// Unisce a coppie tutti i mostri uguali (dal livello più basso): ritorna le unioni fatte come {i: cella, t: nuovo livello}.
// gv (facoltativo): varianti dorate, il risultato è dorato solo se lo sono entrambi
function mergePairs(g,gv){const out=[];for(let t=1;t<MAXT;t++){const ix=[];g.forEach((v,i)=>{if(v===t)ix.push(i)});
 for(let k=0;k+1<ix.length;k+=2){g[ix[k]]=t+1;g[ix[k+1]]=0;if(gv){gv[ix[k]]=gv[ix[k]]&&gv[ix[k+1]]?1:0;gv[ix[k+1]]=0}out.push({i:ix[k],t:t+1})}}return out}
// Stato nuovo dopo l'Evocazione oscura: azzera la partita e tiene solo ciò che è in KEEP, più le Essenze ottenute.
function prestigeState(old,p){const x=def();KEEP.forEach(k=>x[k]=old[k]);x.ord={...old.ord,list:[],nx:[]}; // laboratorio azzerato: gli ordini aperti non sarebbero più realizzabili (grado e statistiche restano)
 x.ess=old.ess+p;x.essT=old.essT+p;x.ach.pr++;
 const s0=1+x.pk.s;x.g[0]=x.g[1]=s0;for(let t=1;t<=s0;t++)x.disc[t-1]=1; // perk «Uova antiche»
 return x}
export {PG1,pgN,GOLD,setHook,eggInt,incBase,essBonus,essMult,offRate,slots,freeCell,PG,mult,val,inc,spCost,UP,PK,PKR,pkrCost,trN,spT,earn,rBase,give,dayNum,pgain,mergePairs,prestigeState,setEvMul};

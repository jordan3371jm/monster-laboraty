import {BN,MAXT} from '../data/config.js';
import {S,R,def,KEEP} from '../core/state.js';

// Bonus delle Essenze: +10% ciascuna fino a ESS_SOFT, poi crescita a potenza (ESS_EXP<1) così i numeri non esplodono.
const ESS_SOFT=50,ESS_EXP=.6;
const essBonus=e=>e<=ESS_SOFT?.1*e:.1*ESS_SOFT*Math.pow(e/ESS_SOFT,ESS_EXP);
const essMult=e=>1+essBonus(e);
// Guadagni offline: parte da 25% e sale con «Sonno profondo» e «Sonno lungo», senza mai superare il gioco attivo.
const offRate=()=>.25+.07*S.up.o+.04*S.pk.o;
// Celle del laboratorio: BN iniziali + 1 per livello di «Laboratorio ampliato»
const slots=()=>BN+S.up.c,freeCell=()=>{const n=slots();for(let i=0;i<n;i++)if(!S.g[i])return i;return -1};
const mult=()=>(1+.25*S.up.l)*essMult(S.essT)*(1+.03*(S.bs-1))*(1+.01*trN())*(1+.2*S.pk.g)*(1+.04*(S.pk.x||0))*(Date.now()<S.boost?2:1);
const val=t=>.5*Math.pow(2.4,t-1);
const inc=()=>S.g.reduce((s,t)=>s+(t?val(t):0),0)*mult();
const spCost=()=>Math.floor(10*Math.pow(2,S.pk.s)*Math.pow(1.07,S.sp)*Math.pow(.92,S.up.d)*Math.pow(.98,S.pk.e||0));
const UP=[{k:'l',max:99,cost:l=>Math.floor(100*Math.pow(2.2,l))},{k:'d',max:10,cost:l=>Math.floor(150*Math.pow(2.5,l))},{k:'o',max:7,cost:l=>Math.floor(200*Math.pow(2.5,l))},{k:'a',max:6,cost:l=>Math.floor(400*Math.pow(3,l))},{k:'c',max:8,cost:l=>Math.floor(1500*Math.pow(3.5,l))}];
const PK=[{k:'s',ic:'🥚',max:6,cost:[2,4,8,16,32,64]},{k:'a',ic:'✨',max:5,cost:[2,3,5,8,12]},{k:'o',ic:'🌙',max:5,cost:[1,2,3,5,8]},{k:'g',ic:'💰',max:8,cost:[1,2,3,4,6,8,11,15]},{k:'b',ic:'👑',max:4,cost:[2,3,5,8]}];
// Rami infiniti dell'albero: livelli ripetibili a costo crescente (x guadagni, t attacco, h vita, e sconto uova, v eventi più frequenti)
const PKR=[{k:'x',ic:'⚗️',max:60},{k:'t',ic:'🗡️',max:60},{k:'h',ic:'🛡️',max:60},{k:'e',ic:'🥚',max:40},{k:'v',ic:'👻',max:15}],pkrCost=l=>Math.ceil(3*Math.pow(1.22,l));
const trN=()=>R.trC,spT=()=>1+S.pk.s; // livello delle uova evocate
const earn=c=>{S.c+=c;S.run+=c;S.lt+=c};
const rBase=()=>Math.max(inc()*300,150),give=(c,e)=>{earn(c);if(e){S.ess+=e;S.essT+=e}};
const dayNum=()=>Math.floor((Date.now()-new Date().getTimezoneOffset()*60000)/864e5);
const PG=200000,pgain=()=>Math.floor(Math.sqrt(S.run/PG)); // monete della partita necessarie per la prima Essenza: PG
// Unisce a coppie tutti i mostri uguali (dal livello più basso): ritorna le unioni fatte come {i: cella, t: nuovo livello}.
function mergePairs(g){const out=[];for(let t=1;t<MAXT;t++){const ix=[];g.forEach((v,i)=>{if(v===t)ix.push(i)});
 for(let k=0;k+1<ix.length;k+=2){g[ix[k]]=t+1;g[ix[k+1]]=0;out.push({i:ix[k],t:t+1})}}return out}
// Stato nuovo dopo l'Evocazione oscura: azzera la partita e tiene solo ciò che è in KEEP, più le Essenze ottenute.
function prestigeState(old,p){const x=def();KEEP.forEach(k=>x[k]=old[k]);x.ess=old.ess+p;x.essT=old.essT+p;x.ach.pr++;
 const s0=1+x.pk.s;x.g[0]=x.g[1]=s0;for(let t=1;t<=s0;t++)x.disc[t-1]=1; // perk «Uova antiche»
 return x}
export {essBonus,essMult,offRate,slots,freeCell,PG,mult,val,inc,spCost,UP,PK,PKR,pkrCost,trN,spT,earn,rBase,give,dayNum,pgain,mergePairs,prestigeState};

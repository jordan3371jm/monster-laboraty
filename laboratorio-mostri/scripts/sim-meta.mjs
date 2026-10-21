// Simulazione della progressione permanente su 28 giorni (una stagione del pass), con le vere funzioni di game/meta.js.
// Due profili: «occasionale» (pochi minuti al giorno) e «attivo» (gioca ogni giorno e fa tutto). Serve a bilanciare
// biglietti, campioni, stelle, Pass e Torre: quanto si ottiene e quando, non a prevedere i giocatori veri.
//   node scripts/sim-meta.mjs
import {S,setS,def} from '../src/core/state.js';
import {CH,MAXSTAR} from '../src/data/champs.js';
import * as M from '../src/game/meta.js';
import {tAtk} from '../src/game/combat.js';

const D0=Date.now,DAY=864e5;
const P={occasionale:{bsDay:1.2,miss:2,wk:0,daily:.6,boss:1,free:2,ad:0,tower:1,merge:20,win:30,iv:.3},
 attivo:{bsDay:2.5,miss:3,wk:1,daily:1,boss:3,free:3,ad:2,tower:3,merge:60,win:60,iv:1}};
function run(name,p){setS(def());S.tut=3;S.bs=10;S.g=[8,8,7,7,6,6,5,5,0];let tk=0,t0=D0();const rows=[];
 const give=n=>{M.addT(n);tk+=n};
 for(let d=0;d<28;d++){Date.now=()=>t0+d*DAY+12*3600e3;
  S.bs=Math.round(10+p.bsDay*d);const top=Math.min(26,8+Math.floor(d/3));S.g=[top,top,top-1,top-1,top-2,top-2,0];
  if(Math.random()<p.daily){give(d%7===6?2:1);M.psAdd(30)}
  for(let k=0;k<p.miss;k++){give(1);M.psAdd(40)}
  if(p.wk&&d%7===6){give(3);M.psAdd(150)}
  for(let k=0;k<p.boss;k++){give([1,2,3][Math.random()<.1?2:Math.random()<.35?1:0]);M.psAdd(15)} // forzieri dei boss nuovi
  if(d%2===0)give(1); // mostro nuovo dal livello 5
  M.psAdd(p.merge,'m');M.psAdd(p.win,'w');
  const before=M.ch().t;for(let k=0;k<p.tower;k++){if(!M.twStart())break;for(let f=0;f<60;f++){const r=M.twFight();if(!r||!r.win)break;if(r.rw.c!==undefined)M.psAdd(15);M.twPick(M.ch().tw.ch[0])}}tk+=M.ch().t-before;
  // fine settimana: invasione (premio medio 10 🎫, a volte il campione esclusivo)
  if(d%7===6&&Math.random()<p.iv){give(10);if(Math.random()<.3)M.giveCh(M.IV_EX)}
  for(let l=1;l<=M.psLv();l++){const o=M.psClaim(l,0);if(o&&o.t)tk+=o.t;if(p.ad){const q=M.psClaim(l,1);if(q&&q.t)tk+=q.t}}
  if(p.ad)M.ch().ps.prem=1;
  let pulls=0;for(let k=0;k<p.free;k++){if(M.pullFree())pulls++;Date.now=()=>t0+d*DAY+12*3600e3+(k+1)*8*3600e3}
  for(let k=0;k<p.ad;k++)if(M.pullAd())pulls++;
  const n=M.ch().t;if(n)M.pullT(n);pulls+=n;
  M.autoEquip();
  const own=Object.keys(M.ch().own).map(Number),stars=own.reduce((s,i)=>s+M.star(i),0);
  if([0,2,6,13,20,27].includes(d))rows.push({giorno:d+1,'🎫 tot':tk,evoc:M.ch().n,campioni:own.length+'/'+CH.length,'★ medie':(own.length?stars/own.length:0).toFixed(1),
   leggendari:own.filter(i=>CH[i].r===3).length,'★5':own.filter(i=>M.star(i)===MAXSTAR).length,'capi ×att':M.atkMul().toFixed(2),pass:M.psLv(),torre:M.ch().tw.rec,equip:M.ch().gear.length})}
 Date.now=D0;console.log('\n== Giocatore '+name+' ==');console.table(rows)}
for(const [k,p] of Object.entries(P))run(k,p);

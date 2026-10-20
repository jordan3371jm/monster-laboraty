import {N,MAXT,WS,E,EXCL_EMO} from '../data/config.js';
import {R,S} from '../core/state.js';
import {dayNum,inc,rBase,setEvMul} from './economy.js';
import {elOf,squad} from './combat.js';

// ---- Iniezione di dipendenza (lato timers) ----
// economy.mult() deve applicare i bonus dei «motivi per tornare», ma non può importare questo modulo
// (import circolare: economy viene eseguito prima di timers). Così è timers, appena caricato, a registrare
// la propria funzione dentro economy con setEvMul(). Se economy gira da sola (test/simulazioni) il
// moltiplicatore resta ×1 e il comportamento è quello classico.

// ---------- Motivi concreti per tornare: tutto ciò che ha un timer ----------
// Spedizioni, uova a tempo, serie giornaliera lunga (7/14/28), eventi settimanali, ordini di unione.
// Nessun server: gli orologi sono dayNum()/weekNum() (già usati dal gioco) più timestamp ms nel salvataggio,
// così i timer avanzano anche mentre si è via (fino al tetto di 8h del gioco offline).
const SEC=1000,MIN=60*SEC,HOUR=3600*SEC,DAY=86400*SEC;
const OFF_CAP=8*HOUR;                     // stesso tetto dei guadagni offline
const num=(x,dv)=>typeof x==='number'&&isFinite(x)?x:dv;
const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x|0));
const frac=x=>Math.max(0,Math.min(1,x||0));
const addC=v=>{S.c+=v;S.run+=v;S.lt+=v};
const addE=v=>{if(v){S.ess+=v;S.essT+=v}};
const since=t=>clamp(num(S.ls,Date.now()),Date.now()-OFF_CAP,Date.now())-Math.min(t,Date.now()); // tempo trascorso, col tetto offline (mai negativo)

// ---- 1) SPEDIZIONI: mandi fuori la squadra per 1h, 4h o 8h ----
// Il premio scala con la forza della squadra e coi guadagni correnti: l'appuntamento conviene sempre di più.
const EXP=[{k:'s',ic:'🌿',dur:HOUR,mul:1},{k:'m',ic:'🗺️',dur:4*HOUR,mul:2.3},{k:'l',ic:'🌌',dur:8*HOUR,mul:3.6}];
const EXPN=1;                             // una sola spedizione alla volta: scegliere la durata è una decisione
const expPow=()=>{const q=squad();return q.length?q.reduce((s,t)=>s+t,0)/q.length:0};   // media dei mostri in squadra
const expVal=(q,pw)=>Math.floor(inc()*EXP[q].dur*.05*(1+.3*pw)*EXP[q].mul);
const expLeft=e=>Math.max(0,e.et-Date.now());
const expReady=()=>S.exp.run.filter(e=>expLeft(e)<=0);
function expStart(q){if(R.PZ)return false;if(!EXP[q]||S.exp.run.length>=EXPN)return false;
 const v=expVal(q,expPow());if(v<=0)return false;
 S.exp.run.push({q,st:Date.now(),et:Date.now()+EXP[q].dur,v});return true}
function expClaim(i){const run=S.exp.run,e=run&&run[i];if(!e||expLeft(e)>0)return null;run.splice(i,1);
 const c=Math.floor(e.v*.6),es=Math.max(1,Math.floor(e.v*.4/rBase()));addC(c);addE(es);S.ach.ex=(S.ach.ex||0)+1;
 if(S.an.f.first_expedition===undefined)S.an.f.first_expedition=Math.max(1,Math.round((Date.now()-S.an.fs)/1000));
 return{c,e:es,q:e.q}}

// ---- 2) UOVA A TEMPO: incubi uova rare (10m → 8h) per monete ed Essenze ----
// Il nido è legato al tipo d'uovo: ogni uovo ha il suo posto, così i timer restano stabili anche se ne compri uno nuovo.
const NEST=3;                             // nidi disponibili (uno ogni 4 uova schiuse): i tipi 0 e 1 sono sempre liberi
const NID=[{ic:'🍒',cost:.05,c:1,e:0,dur:10*MIN},{ic:'🥚',cost:.2,c:3,e:1,dur:HOUR},
 {ic:'✨',cost:.7,c:9,e:2,dur:4*HOUR},{ic:'🌟',cost:2.4,c:26,e:6,dur:8*HOUR}];
// Il tempo dell'uovo non può mai andare sotto il 40% di quello base (con l'albero pieno si arriva a -28%)
const nidDur=t=>Math.max(NID[t].dur*.4,Math.round(NID[t].dur*(1-.04*(S.pk.i||0))));   // perk «Incubatrice» dell'albero delle Essenze
const nidK=()=>Array.isArray(S.inc.k)&&S.inc.k.length?S.inc.k:NID.map((_,i)=>i);
const nidMax=()=>clamp(S.inc.nes||1,1,NEST);
const nidCost=t=>Math.ceil(rBase()*NID[t].cost);
const nidLeft=n=>Math.max(0,nidDur(n.t)-(Date.now()-n.st));
const nidProg=n=>num(n.p,0)/Math.max(1,nidDur(n.t));
const nidGain=n=>({c:Math.floor(nidCost(n.t)*NID[n.t].c),e:NID[n.t].e});
const nidBusy=k=>S.inc.r.some(n=>n.k===k);
function nidBuy(k){if(R.PZ)return false;if(!nidK().includes(k)||nidBusy(k))return false;if(S.inc.r.length>=nidMax())return false;
 const c=nidCost(k);if(S.c<c)return false;S.c-=c;S.inc.r.push({k,t:k,st:Date.now(),p:0});return true}
function nidHatch(i){const n=S.inc.r[i];if(!n||nidLeft(n)>0)return null;S.inc.r.splice(i,1);
 const g=nidGain(n);addC(g.c);addE(g.e);S.ach.h=(S.ach.h||0)+1;S.inc.h=(S.inc.h||0)+1;
 S.inc.nes=clamp(1+((S.inc.h||0)/4|0),1,NEST);
 if(S.an.f.first_hatch===undefined)S.an.f.first_hatch=Math.max(1,Math.round((Date.now()-S.an.fs)/1000));
 return{...g,t:n.t}}
// Le uova marciano anche mentre si è via: si usa il tempo trascorso dall'ultimo tick (col tetto offline di 8h).
// Attenzione: Date.now() va letto prima di aggiornare R.lastO, altrimenti il tempo "trascorso" sarebbe sempre 0.
function nidSync(){const now=Date.now(),dt=Math.max(0,since(R.lastO));R.lastO=now;for(const n of S.inc.r)n.p=num(n.p,0)+dt}
function nidCatchUp(){let got=null;
 for(const n of S.inc.r.slice()){if(n.p>=nidDur(n.t)){const i=S.inc.r.indexOf(n);if(i<0)continue;got=nidHatch(i)||got}}
 return got}

// ---- 3) SERIE GIORNALIERA PIÙ CLEMENTE: scudo + calendario lungo (7 / 14 / 28 giorni) ----
// Lo scudo (1 giorno di grazia) si ricarica al 7° giorno; il premio del 28° è un mostro esclusivo permanente.
const EXCL=MAXT+1;                        // Drago del Tempo: unico mostro fuori dai 26 normali
const isExcl=t=>t===EXCL;
const GR=[{d:7,e:1,sh:1,c:3},{d:14,e:3,c:6},{d:28,mon:EXCL,hp:1,c:20}];
const stMul=()=>1+.01*frac(S.dl.hp)*(isExcl(S.dl.mon)?2:1);   // +1% (+2% col drago) guadagni, permanente
const grDone=d=>(Array.isArray(S.dl.cl)?S.dl.cl:[]).includes(d);
// I traguardi lunghi si riscuotono da soli quando la serie li raggiunge (il 7° e il 14° danno anche monete/🔮,
// il 28° regala il Drago del Tempo e il +1% permanente): niente pulsanti da ricordare, il premio arriva e basta.
function claimLong(){const st=num(S.dl.st,0),cl=S.dl.cl=Array.isArray(S.dl.cl)?S.dl.cl:[],got=[];
 for(const g of GR)if(st>=g.d&&!grDone(g.d)){cl.push(g.d);const c=Math.floor(rBase()*(g.c||3));addC(c);addE(g.e||0);
  if(g.mon){S.disc[EXCL-1]=1;S.dl.mon=1}if(g.hp)S.dl.hp=1;got.push({d:g.d,c,e:g.e||0,mon:!!g.mon,hp:!!g.hp})}
 return got}

// ---- 4) EVENTI SETTIMANALI: calcolati dalla data («Settimana del Fuoco»…) ----
// Bonus a un elemento, un campione a tempo da tenere in laboratorio, una valuta dell'evento (💠) da spendere.
const ELN=['🔥','💧','🌿'],EXCL_IC=EXCL_EMO;
const weekNum=()=>Math.floor((dayNum()+3)/7);                  // la settimana inizia il lunedì
const weekLeft=()=>7-(dayNum()+3)%7;
const evElNow=()=>((weekNum()%3)+3)%3;
const evOn=()=>num(S.ev.wk,-1)===weekNum();
const evKey=()=>'e'+weekNum();
const evGoal=()=>Math.floor(120+40*Math.min(20,num(S.ach.pr,0)));
const evNeed=()=>Math.ceil(evGoal()/(1+frac(S.ev.x)));          // spilla dell'evento: serve meno progresso
const evShop=()=>{const s=S.ev.sp[evKey()];return Array.isArray(s)?s:[]};
const evBought=i=>evShop().includes(i);
const evCan=i=>{const it=SH[i];return evOn()&&!evBought(i)&&num(S.ev.p,0)>=Math.ceil(it.c/(1+frac(S.ev.x)))};
function evCheck(){const w=weekNum(),prev=num(S.ev.wk,-1);
 if(prev!==w){if(prev>=0&&prev===w-1&&num(S.ev.ok,0)>=1)S.ev.got=1; // chi ha partecipato riceve un uovo dell'evento
  S.ev.wk=w;S.ev.el=evElNow();S.ev.p=0;S.ev.b=0;S.ev.x=0;S.ev.m=null;S.ev.got=S.ev.got||0;
  if(prev>=0)R.evNew=1}}                                            // il primo avvio non mostra l'avviso «nuovo evento»
 if(!S.ev.m||num(S.ev.m.wk,-1)!==w)S.ev.m={wk:w,t:1+(Math.abs(w*7)%MAXT),lv:5+(Math.abs(w>>>2)%3),left:num(S.ev.b,0)*6*HOUR};
 if(!Array.isArray(S.ev.cl))S.ev.cl=[];if(!S.ev.sp||typeof S.ev.sp!=='object')S.ev.sp={}
function evAdd(n){if(!evOn()||n<=0)return;const need=evNeed(),before=num(S.ev.b,0);
 S.ev.p=num(S.ev.p,0)+n;S.ev.ok=(S.ev.ok||0)+1;
 while(num(S.ev.b,0)*need<=S.ev.p)S.ev.b=num(S.ev.b,0)+1;
 const gained=num(S.ev.b,0)-before;
 if(gained>0){S.ach.we=(S.ach.we||0)+gained;
  if(S.an.f.week_event===undefined)S.an.f.week_event=Math.max(1,Math.round((Date.now()-S.an.fs)/1000));
  if(S.ev.m)S.ev.m.left=num(S.ev.m.left,0)+gained*6*HOUR}       // ogni 💠 allunga il tempo del campione
 if(S.ev.m&&S.ev.m.left>0)S.ev.m.left=Math.max(0,S.ev.m.left-n*30*SEC)}
function evBuy(i){const it=SH[i];if(!evCan(i))return false;
 S.ev.p-=Math.ceil(it.c/(1+frac(S.ev.x)));S.ev.sp[evKey()]=[...evShop(),i];
 if(it.boost)S.boost=Math.max(Date.now(),S.boost)+it.boost*MIN*SEC;
 if(it.co)addC(Math.floor(rBase()*it.co));
 if(it.ess)addE(it.ess);
 if(it.hp)S.dl.hp=1;
 if(it.x)S.ev.x=Math.min(.6,frac(S.ev.x)+it.x);
 if(it.m){for(let k=0;k<N;k++)S.g[k]=it.m.t;S.ev.m={wk:num(S.ev.wk,0),t:it.m.t,lv:it.m.lv,left:it.m.left}}
 if(it.egg)S.inc.r.push({k:1,t:1,st:Date.now()-nidDur(1),p:nidDur(1)}); // uovo dell'evento già pronto
 return true}
// Il vantaggio dell'evento: +20% guadagni se almeno metà del laboratorio è dell'elemento in festa
function elBonus(){if(!evOn())return 1;const g=S.g.filter(Boolean);if(!g.length)return 1;
 return g.filter(t=>t!==EXCL&&elOf(t)===S.ev.el).length/g.length>=.5?1.2:1}
// Il campione dell'evento, se ancora in laboratorio, dà un bonus: tenerlo fermo diventa una scelta
function evMonBonus(){const m=S.ev.m;if(!m||!(num(m.left,0)>0)||!S.g.some(t=>t===m.t))return 1;return 1+.3*(m.lv/7)}
function evTick(dt){if(!evOn())return;const m=S.ev.m;if(m&&m.left>0)m.left=Math.max(0,m.left-dt*SEC)}
// Negozio dell'evento: cosa comprare con 💠
const SH=[{ic:'⚡',c:60,boost:60,k:'ev_b1'},{ic:'🪙',c:40,co:3,k:'ev_b2'},{ic:'🔮',c:90,ess:3,k:'ev_b3'},
 {ic:'🥚',c:150,egg:1,k:'ev_b4'},{ic:'🎖️',c:200,hp:1,k:'ev_b5'},{ic:'⭐',c:300,m:{t:MAXT,lv:7,left:7*DAY},k:'ev_b6'}];

// ---- 5) ORDINI DI UNIONE: richieste a tempo («porta un mostro di livello 8 entro 5 minuti») ----
// Danno uno scopo alle unioni; il livello richiesto segue il laboratorio, così restano sempre possibili.
// Due tipi di richiesta: «almeno livello X» (un mostro forte che hai già) oppure «livello esatto X» (serve un'unione).
const ORDT=[{min:2,max:4},{min:5,max:7},{min:8,max:10},{min:11,max:13}],ORD_DUR=5*MIN,ORD_Q=2;
const ordLv=()=>clamp(Math.round(num(S.ach.wn,0)/10)+1,1,ORDT.length);
const ordList=()=>S.ord.list;
const ordLeft=o=>Math.max(0,o.et-Date.now());
function mkOrd(){const mx=Math.max(0,...S.g),rg=ORDT[Math.min(ordLv(),ORDT.length)-1];
 let t=clamp(Math.min(mx,rg.max),rg.min,MAXT);if(t<rg.min)t=Math.min(MAXT,Math.max(rg.min,mx+1));
 const k=mx>=t&&Math.random()<.5?'at':'ex'; // «esatto» con il livello massimo non ha senso: nessuno può produrlo
 return{t,k,ic:k==='ex'?E[t-1]:EXCL_EMO,st:Date.now(),et:Date.now()+ORD_DUR*SEC,c:0}}
function ordFill(){const l=ordList();while(l.length<ORD_Q)l.push(mkOrd())}
const ordOk=o=>!o.c&&(o.k==='at'?S.g.some(t=>t>=o.t):S.g.some(t=>t===o.t));
function ordClaim(i){const l=ordList(),o=l[i];if(!o||!ordOk(o))return null;o.c=1;
 const tier=Math.min(ORDT.length,Math.max(1,num(S.ord.tier,1))),c=Math.floor(rBase()*(.8+.4*o.t)*(1+.25*tier)*(o.k==='ex'?1.2:1)),
 e=Math.max(1,Math.floor(o.t/4)+tier-1);
 S.ord.hot=Date.now()+10*MIN;addC(c);addE(e);S.ord.n=(S.ord.n||0)+1;S.ord.best=Math.max(num(S.ord.best,0),o.t);S.ord.tier=Math.min(ORDT.length,tier+1);S.ord.miss=0;
 if(S.an.f.first_order===undefined)S.an.f.first_order=Math.max(1,Math.round((Date.now()-S.an.fs)/1000));return{c,e,t:o.t,k:o.k}}
// Se scadono 4 ordini di fila si scende di grado (premi più piccoli), non si perde nulla: meglio essere clementi
function ordTick(){const l=ordList();let miss=0;
 for(const o of l)if(!o.c&&Date.now()>o.et){o.c=2;miss++}
 if(miss){S.ord.miss=(S.ord.miss||0)+miss;if(S.ord.miss>=4){S.ord.miss=0;S.ord.tier=Math.max(1,(S.ord.tier||1)-1)}}
 ordFill()}

// ---- Moltiplicatore comune a tutti i «motivi per tornare» (lo chiama economy.mult) ----
// Evento della settimana (elemento in festa + campione tenuto in laboratorio), premio permanente della serie lunga,
// ordine di unione appena completato (+8% per 10 minuti: le unioni danno una spinta immediata).
// Il tetto OFF_CAP si applica ai timer che usano il tempo trascorso (uova): la spedizione ha un orario di fine
// fisso, quindi al ritorno dopo 8h è semplicemente pronta — come i guadagni offline, non si accumulano all'infinito.
function calcEvMul(){let m=elBonus()*evMonBonus()*stMul();
 if(num(S.ord.hot,0)>Date.now())m*=1.08;
 return isFinite(m)&&m>0?m:1}
// ---- Collegamenti con le altre parti del gioco (chiamati dai moduli UI, qui dentro niente import circolare) ----
// 1) Le missioni chiamano prog('event') per ogni 👻💎 catturato: durante l'evento vale anche come progresso della settimana.
// 2) Ogni unione fa avanzare gli ordini di unione «a livello esatto»: se il mostro richiesto è appena comparso,
//    la campanella può suonare subito, senza aspettare il tick dopo.
function onProg(t,n){if(t==='event'&&n>0)evAdd(n)}
function onMerge(){for(const o of ordList())if(!o.c&&ordOk(o))return true;return false}
setEvMul(calcEvMul); // economy.js lo invoca dentro mult(): niente import circolare

// ---- Segnali dentro il gioco: campanella (il portale web non ha push), barra obiettivo, finestra «bentornato» ----
// Ritorna solo chiavi di testo + dati: i testi tradotti si costruiscono in ui/timers.js.
const bells=()=>{const out=[];
 for(const e of expReady())out.push({a:'xb',i:S.exp.run.indexOf(e),k:'exp_'+EXP[e.q].k,ic:EXP[e.q].ic});
 S.inc.r.forEach((n,i)=>{if(nidLeft(n)<=0)out.push({a:'hb',i,k:'nidRdy',ic:NID[n.t].ic})});
 ordList().forEach((o,i)=>{if(ordOk(o))out.push({a:'ob',i,k:'ordRdy',ic:'📜'})});
 if(evOn()&&SH.some((_,i)=>evCan(i)))out.push({a:'goEv',k:'evGo',ic:'🎪'});
 return out};
// Obiettivo a tempo da mostrare subito: prima le cose pronte (premi da riscuotere), poi la prossima scadenza
function goal(){const b=bells();if(b.length)return{...b[0],p:1};
 const h=horizon();if(h)return{k:'soon',t:h.txt,go:h.go,p:1-Math.min(1,h.ms/(8*HOUR))};
 return null}
// Quanto manca alla prossima scadenza (per la barra «prossimo obiettivo»)
function horizon(){let best=null;
 const upd=(ms,go)=>{if(ms>=0&&(best===null||ms<best.ms))best={ms,go}};
 for(const e of S.exp.run)upd(expLeft(e),'tExp');
 for(const n of S.inc.r)upd(nidLeft(n),'tLab');
 for(const o of ordList())if(!o.c)upd(ordLeft(o),'tLab');
 if(best)best.txt=fmtT(best.ms);
 return best}

const fmtT=ms=>{ms=Math.max(0,Math.round(ms/1000));const h=Math.floor(ms/3600),m=Math.floor(ms%3600/60);
 return h?h+'h '+m+'m':m?m+'m '+(ms%60)+'s':ms+'s'};

// Ogni tick: le uova marciano col tempo reale (col tetto offline), cambia l'evento della settimana.
// Gli ordini NON si fanno avanzare qui: se no basterebbe restare sulla pagina 5 minuti perché scadano tutti.
// Scadono solo mentre sei davvero via (viene chiamato dal salvataggio e quando si nasconde la scheda).
function timersTick(){nidSync();nidCatchUp();evCheck()}
function ordersExpire(){ordTick();ordFill()}

export {SEC,MIN,HOUR,DAY,OFF_CAP,since,timersTick,ordersExpire,
 EXP,EXPN,expPow,expVal,expLeft,expReady,expStart,expClaim,
 NEST,NID,nidK,nidMax,nidCost,nidDur,nidLeft,nidProg,nidGain,nidBusy,nidBuy,nidHatch,nidSync,nidCatchUp,
 EXCL,isExcl,GR,stMul,grDone,claimLong,onProg,
 ELN,EXCL_IC,weekNum,weekLeft,evElNow,evOn,evKey,evGoal,evNeed,evShop,evBought,evCan,evCheck,evAdd,evBuy,elBonus,evMonBonus,evTick,SH,
 ORDT,ORD_DUR,ORD_Q,ordLv,ordList,ordLeft,ordFill,ordOk,ordClaim,ordTick,
 bells,goal,horizon,fmtT};

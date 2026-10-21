import {MAXT,E,EXCL_EMO} from '../data/config.js';
import {R,S} from '../core/state.js';
import {dayNum,freeCell,inc,pgain,rBase,setEvMul} from './economy.js';
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
const since=t=>{const n=Date.now();return Math.max(0,Math.min(OFF_CAP,n-Math.min(num(t,n),n)))}; // ms trascorsi da t, col tetto offline (mai negativo; niente |0: i timestamp superano i 32 bit)

// ---- 1) SPEDIZIONI: mandi fuori la squadra per 1h, 4h o 8h ----
// Il premio scala con la forza della squadra e coi guadagni correnti: l'appuntamento conviene sempre di più.
// es = quota delle Essenze che otterresti ora con l'Evocazione oscura (pgain): crescono coi progressi, non sono un guadagno fisso a ogni viaggio
const EXP=[{k:'s',ic:'🌿',dur:HOUR,mul:1,es:0},{k:'m',ic:'🗺️',dur:4*HOUR,mul:2.3,es:.04},{k:'l',ic:'🌌',dur:8*HOUR,mul:3.6,es:.1}];
const EXPN=1;                             // una sola spedizione alla volta: scegliere la durata è una decisione
// «Cesta dei timer» (perk w): -2% tempi di spedizioni e uova per livello, con lo stesso tetto del 40% delle uova
const wMul=()=>Math.max(.4,1-.02*(S.pk.w||0));
const expDur=q=>Math.round(EXP[q].dur*wMul());
const expPow=()=>{const q=squad();return q.length?q.reduce((s,t)=>s+t,0)/q.length:0};   // media dei mostri in squadra
const incBase=()=>inc()/(Date.now()<S.boost?2:1);   // senza il boost x2: non si gonfia il premio lanciando la spedizione a boost attivo
const expVal=(q,pw)=>{const full=incBase()*(expDur(q)/SEC);return Math.floor(Math.min(full*.05*(1+.3*pw)*EXP[q].mul,full*.4))};   // tetto: mai oltre il 40% del guadagno pieno del periodo (la forza della squadra è già dentro inc())   // inc() è per SECONDO: la durata va in secondi (in ms il premio era 1000 volte troppo alto)
const expLeft=e=>Math.max(0,e.et-Date.now());
const expReady=()=>S.exp.run.filter(e=>expLeft(e)<=0);
function expStart(q){if(R.PZ)return false;if(!EXP[q]||S.exp.run.length>=EXPN)return false;
 const v=expVal(q,expPow());if(v<=0)return false;
 S.exp.run.push({q,st:Date.now(),et:Date.now()+expDur(q),v});return true}
const expGain=q=>Math.floor(pgain()*EXP[q].es),expCoins=v=>Math.floor(v*.8);
function expClaim(i){const run=S.exp.run,e=run&&run[i];if(!e||expLeft(e)>0)return null;run.splice(i,1);
 const c=expCoins(e.v),es=expGain(e.q);addC(c);addE(es);S.ach.ex=(S.ach.ex||0)+1;
 if(S.an.f.first_expedition===undefined)S.an.f.first_expedition=Math.max(1,Math.round((Date.now()-S.an.fs)/1000));
 return{c,e:es,q:e.q}}

// ---- 2) UOVA A TEMPO: incubi uova rare (10m → 8h) per monete ed Essenze ----
// Il nido è legato al tipo d'uovo: ogni uovo ha il suo posto, così i timer restano stabili anche se ne compri uno nuovo.
const NEST=3;                             // nidi disponibili (uno ogni 4 uova schiuse): i tipi 0 e 1 sono sempre liberi
// e = quota delle Essenze ottenibili ora con l'Evocazione oscura (pgain), non un numero fisso
const NID=[{ic:'🍒',cost:.05,c:1,e:0,dur:10*MIN},{ic:'🥚',cost:.2,c:3,e:.02,dur:HOUR},
 {ic:'✨',cost:.7,c:9,e:.05,dur:4*HOUR},{ic:'🌟',cost:2.4,c:26,e:.12,dur:8*HOUR}];
// Il tempo dell'uovo non può mai andare sotto il 40% di quello base (con l'albero pieno si arriva a -28%)
const nidDur=t=>Math.max(NID[t].dur*.4,Math.round(NID[t].dur*(1-.04*(S.pk.i||0))*wMul()));   // perk «Incubatrice» (i) e «Cesta dei timer» (w)
const nidK=()=>Array.isArray(S.inc.k)&&S.inc.k.length?S.inc.k:NID.map((_,i)=>i);
const nidMax=()=>clamp(S.inc.nes||1,1,NEST);
const nidCost=t=>Math.ceil(rBase()*NID[t].cost);
const nidLeft=n=>Math.max(0,n.st+nidDur(n.t)-Date.now());   // sempre sull'orologio: stessa regola delle spedizioni
const nidProg=n=>1-nidLeft(n)/Math.max(1,nidDur(n.t));
const nidGain=n=>({c:Math.floor((n.b>0?n.b:nidCost(n.t))*NID[n.t].c),e:Math.floor(pgain()*NID[n.t].e)});   // n.b = costo pagato all'acquisto: il rendimento è fisso, non cresce se nel frattempo il reddito sale
const nidBusy=k=>S.inc.r.some(n=>n.k===k);
function nidBuy(k){if(R.PZ)return false;if(!nidK().includes(k)||nidBusy(k))return false;if(S.inc.r.length>=nidMax())return false;
 const c=nidCost(k);if(S.c<c)return false;S.c-=c;S.inc.r.push({k,t:k,st:Date.now(),b:c});return true}
function nidHatch(i){const n=S.inc.r[i];if(!n||nidLeft(n)>0)return null;S.inc.r.splice(i,1);
 const g=nidGain(n);addC(g.c);addE(g.e);S.ach.h=(S.ach.h||0)+1;S.inc.h=(S.inc.h||0)+1;
 S.inc.nes=clamp(1+((S.inc.h||0)/4|0),1,NEST);
 if(S.an.f.first_hatch===undefined)S.an.f.first_hatch=Math.max(1,Math.round((Date.now()-S.an.fs)/1000));
 return{...g,t:n.t}}
// Le uova non si schiudono da sole: restano «pronte» finché non le riscuoti (è il motivo per tornare). Il tempo va sull'orologio, quindi corre anche a gioco chiuso.

// ---- 3) SERIE GIORNALIERA PIÙ CLEMENTE: scudo + calendario lungo (7 / 14 / 28 giorni) ----
// Lo scudo (1 giorno di grazia) si ricarica al 7° giorno; il premio del 28° è un mostro esclusivo permanente.
const EXCL=MAXT+1;                        // Drago del Tempo: unico mostro fuori dai 26 normali
const isExcl=t=>t===EXCL;
const GR=[{d:7,e:1,sh:1,c:3},{d:14,e:3,c:6},{d:28,mon:EXCL,hp:1,c:20}];
const stMul=()=>1+.01*(S.dl.hp?1:0)+.02*(S.dl.mon?1:0);   // +1% (insegna) e +2% (Drago del Tempo) guadagni, permanenti
const grDone=d=>(Array.isArray(S.dl.cl)?S.dl.cl:[]).includes(d);
// I traguardi lunghi si riscuotono da soli quando la serie li raggiunge (il 7° e il 14° danno anche monete/🔮,
// il 28° regala il Drago del Tempo e il +1% permanente): niente pulsanti da ricordare, il premio arriva e basta.
function claimLong(){const st=num(S.dl.st,0),cl=S.dl.cl=Array.isArray(S.dl.cl)?S.dl.cl:[],got=[];
 for(const g of GR)if(st>=g.d&&!grDone(g.d)){cl.push(g.d);const c=Math.floor(rBase()*(g.c||3));addC(c);addE(g.e||0);
  if(g.mon)S.dl.mon=1; // il Drago NON entra in S.disc: statistiche e trofei contano solo i 26 mostri
  if(g.hp)S.dl.hp=1;got.push({d:g.d,c,e:g.e||0,mon:!!g.mon,hp:!!g.hp})}
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
const evPrice=i=>Math.ceil(SH[i].c/(1+frac(S.ev.x)));
const evCan=i=>{const it=SH[i];return !!it&&evOn()&&!evBought(i)&&num(S.ev.p,0)>=evPrice(i)&&(!it.champ||freeCell()>=0)};
// Il campione della settimana è un mostro vicino al tuo migliore (mai fuori portata): tenerlo in laboratorio dà un bonus ai guadagni
const evChampTier=()=>Math.max(2,Math.min(MAXT,S.disc.lastIndexOf(1)+1-2));
// Uovo dell'evento: va nel primo nido libero, già pronto da riscuotere. Se i nidi sono pieni diventa subito il suo premio (niente si perde).
function evEggGive(){const t=1;
 if(S.inc.r.length<nidMax()&&!nidBusy(t)){S.inc.r.push({k:t,t,st:Date.now()-nidDur(t)});return 'egg'}
 const g=nidGain({t});addC(g.c);addE(g.e);return 'coins'}
function evCheck(){const w=weekNum(),prev=num(S.ev.wk,-1);
 if(prev!==w){const part=prev>=0&&prev===w-1&&num(S.ev.ok,0)>=1;       // chi ha partecipato alla settimana scorsa riceve un uovo dell'evento
  S.ev.wk=w;S.ev.el=evElNow();S.ev.p=0;S.ev.tot=0;S.ev.b=0;S.ev.ok=0;S.ev.x=0;S.ev.m=null;S.ev.sp={};S.ev.got=0;
  if(part){evEggGive();S.ev.got=1;R.evEgg=1}
  if(prev>=0&&w-prev>1)R.evNew=0;                                   // tornati dopo molte settimane: niente avviso «nuovo evento» (l'evento corrente è già iniziato da tempo)
  else if(prev>=0)R.evNew=1}                                        // il primo avvio non mostra l'avviso «nuovo evento»
 if(!S.ev.m||num(S.ev.m.wk,-1)!==w)S.ev.m={wk:w,t:evChampTier(),lv:5+(Math.abs(w>>>2)%3),left:0};
 if(!Array.isArray(S.ev.cl))S.ev.cl=[];if(!S.ev.sp||typeof S.ev.sp!=='object')S.ev.sp={}}
// 1 💠 per ogni 👻💎 catturato. Ogni evGoal 💠 GUADAGNATE (anche se poi spese) = una spilla = +6h di campione.
function evAdd(n){if(!evOn()||!(n>0))return;
 S.ev.p=num(S.ev.p,0)+n;S.ev.tot=num(S.ev.tot,0)+n;S.ev.ok=(S.ev.ok||0)+1;
 const was=num(S.ev.b,0),now=Math.floor(S.ev.tot/evNeed());
 if(now>was){S.ev.b=now;S.ach.we=(S.ach.we||0)+(now-was);
  if(S.an.f.week_event===undefined)S.an.f.week_event=Math.max(1,Math.round((Date.now()-S.an.fs)/1000));
  if(S.ev.m)S.ev.m.left=num(S.ev.m.left,0)+(now-was)*6*HOUR}}
function evBuy(i){const it=SH[i];if(!evCan(i))return false;
 S.ev.p-=evPrice(i);S.ev.sp[evKey()]=[...evShop(),i];
 if(it.boost)S.boost=Math.max(Date.now(),S.boost)+it.boost*MIN;          // MIN è già in ms
 if(it.co)addC(Math.floor(rBase()*it.co));
 if(it.ess)addE(it.ess);
 if(it.hp)S.dl.hp=1;
 if(it.x)S.ev.x=Math.min(.6,frac(S.ev.x)+it.x);
 if(it.champ){S.g[freeCell()]=S.ev.m.t;S.ev.m.left=num(S.ev.m.left,0)+it.champ}   // UN mostro campione in una cella libera (non l'intero laboratorio)
 if(it.egg)evEggGive();
 return true}
// Il vantaggio dell'evento: +20% guadagni se almeno metà del laboratorio è dell'elemento in festa
function elBonus(){if(!evOn())return 1;const g=S.g.filter(Boolean);if(!g.length)return 1;
 return g.filter(t=>elOf(t)===S.ev.el).length/g.length>=.5?1.2:1}
// Il campione dell'evento, se ancora in laboratorio, dà un bonus: tenerlo fermo diventa una scelta
function evMonBonus(){const m=S.ev.m;if(!m||!(num(m.left,0)>0)||!S.g.some(t=>t===m.t))return 1;return 1+.3*(m.lv/7)}
// Il tempo del campione scorre sull'orologio (ms), anche a gioco chiuso fino al tetto offline
function evClock(ms){if(!evOn())return;const m=S.ev.m;if(m&&m.left>0)m.left=Math.max(0,m.left-ms)}
// Negozio dell'evento: cosa comprare con 💠
const SH=[{ic:'⚡',c:60,boost:60,k:'ev_b1'},{ic:'🪙',c:40,co:3,k:'ev_b2'},{ic:'🔮',c:90,ess:3,k:'ev_b3'},
 {ic:'🥚',c:150,egg:1,k:'ev_b4'},{ic:'🎖️',c:200,hp:1,k:'ev_b5'},{ic:'⭐',c:300,champ:7*DAY,k:'ev_b6'}];

// ---- 5) ORDINI DI UNIONE: richieste a tempo («crea un mostro di livello 8 entro 5 minuti») ----
// Un ordine si completa quando UNA UNIONE (fatta dopo la sua nascita) produce il livello richiesto: «almeno X» oppure «esattamente X».
// Il livello richiesto non supera mai quello creabile con i mostri che hai già (massa del laboratorio senza il mostro più alto),
// quindi un ordine non è mai impossibile né già soddisfatto alla nascita. Scadono dopo 5 minuti senza penalità se non per il grado.
const ORDT=[{min:2,max:4},{min:5,max:7},{min:8,max:10},{min:11,max:13}],ORD_DUR=5*MIN,ORD_Q=2,ORD_SHOW=4*SEC,ORD_WAIT=5*MIN;   // ORD_WAIT: pausa prima che un posto libero riceva un nuovo ordine
const ordLv=()=>clamp(Math.max(Math.floor(num(S.ach.mg,0)/40)+1,Math.floor(num(S.ord.best,0)/4)+1),1,ORDT.length);
const ordList=()=>S.ord.list;
const ordLeft=o=>Math.max(0,o.et-Date.now());
function ordReach(){const g=S.g.filter(Boolean);if(!g.length)return 2;
 const mx=Math.max(...g),spare=g.reduce((s,t)=>s+Math.pow(2,t-1),0)-Math.pow(2,mx-1);
 return Math.max(2,Math.min(MAXT,Math.floor(Math.log2(Math.max(spare,1)))+1))}
function mkOrd(){const rg=ORDT[ordLv()-1],r=ordReach();
 let t=Math.min(rg.max,Math.max(rg.min,r));if(t>r)t=r;                    // mai oltre ciò che si può creare
 const k=Math.random()<.5?'at':'ex',n=Date.now();
 return{t,k,ic:E[t-1],st:n,et:n+ORD_DUR,c:0,d:0}}                          // c: 0 aperto, 1 riscosso, 2 scaduto · d: 1 = unione fatta
const ordOpen=()=>ordList().filter(o=>!o.c).length;
// Un posto che si libera (riscosso o scaduto) riceve un nuovo ordine solo dopo ORD_WAIT: senza pausa si potevano riscuotere ordini a raffica
// (ognuno vale minuti di guadagno) e il reddito si moltiplicava. S.ord.nx = orari in cui i posti liberi si riempiono.
function ordFill(){if(S.tut<3||!S.g.some(Boolean))return;const l=ordList(),nx=S.ord.nx=Array.isArray(S.ord.nx)?S.ord.nx:[],n=Date.now();
 while(ordOpen()<ORD_Q&&l.length<ORD_Q+2){if(nx.length){if(nx[0]>n)break;nx.shift()}l.push(mkOrd())}}
const ordFree=()=>{const nx=Array.isArray(S.ord.nx)?S.ord.nx:S.ord.nx=[];nx.push(Date.now()+ORD_WAIT);nx.sort((a,b)=>a-b);nx.length=Math.min(nx.length,ORD_Q)};
const ordOk=o=>!o.c&&!!o.d;
// Da chiamare a ogni unione con il livello APPENA creato (tocco, «Unisci tutto», unione automatica). Ritorna true se un ordine è diventato riscuotibile.
function onMerge(t){let hit=false;
 for(const o of ordList())if(!o.c&&!o.d&&Date.now()<=o.et&&(o.k==='at'?t>=o.t:t===o.t)){o.d=1;hit=true}
 return hit}
// Essenze: una piccola quota di quelle del prestigio, mai un premio fisso
// Premio contenuto (al massimo ~1 minuto di guadagno): gli ordini sono un extra per chi unisce, non la fonte principale di monete
function ordReward(o){const tier=Math.min(ORDT.length,Math.max(1,num(S.ord.tier,1)));
 return{c:Math.floor(rBase()*Math.min(.2,(.08+.012*o.t)*(1+.15*(tier-1)))*(o.k==='ex'?1.2:1)),e:Math.floor(pgain()*(.01+.01*tier))}}
function ordClaim(i){const l=ordList(),o=l[i];if(!o||!ordOk(o))return null;o.c=1;o.ct=Date.now();ordFree();
 const tier=Math.min(ORDT.length,Math.max(1,num(S.ord.tier,1))),{c,e}=ordReward(o);
 S.ord.hot=Date.now()+10*MIN;addC(c);addE(e);S.ord.n=(S.ord.n||0)+1;S.ach.od=(S.ach.od||0)+1;S.ord.best=Math.max(num(S.ord.best,0),o.t);S.ord.tier=Math.min(ORDT.length,tier+1);S.ord.miss=0;
 if(S.an.f.first_order===undefined)S.an.f.first_order=Math.max(1,Math.round((Date.now()-S.an.fs)/1000));return{c,e,t:o.t,k:o.k}}
// Scaduti: se ne scadono 4 di fila si scende di grado (premi più piccoli), non si perde nulla.
// Gli ordini chiusi restano visibili ORD_SHOW ms («Riscosso» / «Scaduto») poi escono e ne arriva uno nuovo.
function ordTick(){const l=ordList(),n=Date.now();let miss=0;
 for(const o of l)if(!o.c&&!o.d&&n>o.et){o.c=2;o.ct=n;miss++;ordFree()}
 if(miss){S.ord.miss=(S.ord.miss||0)+miss;if(S.ord.miss>=4){S.ord.miss=0;S.ord.tier=Math.max(1,(S.ord.tier||1)-1)}}
 S.ord.list=l.filter(o=>!o.c||n-num(o.ct,n)<ORD_SHOW);ordFill()}

// ---- Moltiplicatore comune a tutti i «motivi per tornare» (lo chiama economy.mult) ----
// Evento della settimana (elemento in festa + campione tenuto in laboratorio), premio permanente della serie lunga,
// ordine di unione appena completato (+8% per 10 minuti: le unioni danno una spinta immediata).
// Il tetto OFF_CAP si applica ai timer che usano il tempo trascorso (uova): la spedizione ha un orario di fine
// fisso, quindi al ritorno dopo 8h è semplicemente pronta — come i guadagni offline, non si accumulano all'infinito.
function calcEvMul(){let m=elBonus()*evMonBonus()*stMul();
 if(num(S.ord.hot,0)>Date.now())m*=1.08;
 return isFinite(m)&&m>0?m:1}
// ---- Collegamenti con le altre parti del gioco (chiamati dai moduli UI, qui dentro niente import circolare) ----
// 1) Le missioni chiamano prog('event') per ogni 👻💎 catturato: durante l'evento vale anche come progresso della settimana
//    (missions.js, dentro prog(), richiama onProg() subito dopo aver avanzato le missioni).
// 2) Ogni unione chiama onMerge(livello): se l'ordine richiede proprio quel livello diventa riscuotibile (vedi sopra).
function onProg(t,n){if(t==='event'&&n>0)evAdd(n)}
setEvMul(calcEvMul); // economy.js lo invoca dentro mult(): niente import circolare

// ---- Segnali dentro il gioco: campanella (il portale web non ha push), barra obiettivo, finestra «bentornato» ----
// Ritorna solo chiavi di testo + dati: i testi tradotti si costruiscono in ui/timers.js.
const GKEY={xb:'g_exp',hb:'g_nid',ob:'g_ord',goEv:'g_ev'};
const bells=()=>{const out=[];
 for(const e of expReady())out.push({a:'xb',i:S.exp.run.indexOf(e),k:'exp_'+EXP[e.q].k,ic:EXP[e.q].ic});
 S.inc.r.forEach((n,i)=>{if(nidLeft(n)<=0)out.push({a:'hb',i,k:'nidRdy',ic:NID[n.t].ic})});
 ordList().forEach((o,i)=>{if(ordOk(o))out.push({a:'ob',i,k:'ordRdy',ic:'📜'})});
 if(evOn()&&SH.some((_,i)=>evCan(i)))out.push({a:'goEv',k:'evGo',ic:'🎪'});
 return out};
// Obiettivo a tempo da mostrare subito: prima le cose pronte (premi da riscuotere), poi la prossima scadenza
function goal(){const b=bells();if(b.length)return{...b[0],p:1,gk:GKEY[b[0].a]||'soon'};
 const h=horizon();if(h)return{k:'soon',gk:'soon',t:h.txt,go:h.go,p:1-Math.min(1,h.ms/(8*HOUR))};
 return null}
// Quanto manca alla prossima scadenza (per la barra «prossimo obiettivo»)
function horizon(){let best=null;
 const upd=(ms,go)=>{if(ms>=0&&(best===null||ms<best.ms))best={ms,go}};
 for(const e of S.exp.run)upd(expLeft(e),'tExp');
 for(const n of S.inc.r)upd(nidLeft(n),'tExp');
 for(const o of ordList())if(!o.c&&!o.d)upd(ordLeft(o),'tExp');
 if(best)best.txt=fmtT(best.ms);
 return best}

const fmtT=ms=>{ms=Math.max(0,Math.round(ms/1000));const h=Math.floor(ms/3600),m=Math.floor(ms%3600/60);
 return h?h+'h '+m+'m':m?m+'m '+(ms%60)+'s':ms+'s'};

// Ogni tick: cambia l'evento della settimana, scorre il tempo del campione, scadono/nascono gli ordini.
// Spedizioni e uova usano un orario di fine fisso (nessun conteggio da aggiornare): a gioco chiuso restano semplicemente «pronte».
function timersTick(){const n=Date.now(),dt=Math.max(0,Math.min(OFF_CAP,n-num(R.lastO,n)));R.lastO=n;evCheck();evClock(dt);ordTick()}
function ordersExpire(){ordTick()}
// Accelerazione con pubblicità con premio: -1 ora su una spedizione o su un uovo (si chiama dentro adThen)
const SPEED=HOUR;
function expSpeed(i){const e=S.exp.run[i];if(!e)return false;e.et-=SPEED;return true}
function nidSpeed(i){const n=S.inc.r[i];if(!n)return false;n.st-=SPEED;return true}

export {SEC,MIN,HOUR,DAY,OFF_CAP,SPEED,since,timersTick,ordersExpire,
 EXP,EXPN,expDur,expPow,expVal,expGain,expCoins,expLeft,expReady,expStart,expClaim,expSpeed,
 NEST,NID,nidK,nidMax,nidCost,nidDur,nidLeft,nidProg,nidGain,nidBusy,nidBuy,nidHatch,nidSpeed,
 EXCL,isExcl,GR,stMul,grDone,claimLong,onProg,
 ELN,EXCL_IC,weekNum,weekLeft,evElNow,evOn,evKey,evGoal,evNeed,evShop,evBought,evPrice,evCan,evCheck,evAdd,evBuy,elBonus,evMonBonus,evClock,evChampTier,SH,
 ORDT,ORD_DUR,ORD_Q,ORD_WAIT,ordLv,ordList,ordLeft,ordFill,ordOk,ordClaim,ordReward,ordTick,onMerge,ordReach,
 bells,goal,horizon,fmtT};

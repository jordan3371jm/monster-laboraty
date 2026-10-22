// Test della logica dei «motivi per tornare» (game/timers.js): spedizioni, uova, ordini, evento, serie lunga, salvataggio. Tempo simulato.
import {S,setS,def} from '../src/core/state.js';
import {freeCell,prestigeState,inc} from '../src/game/economy.js';
import * as T from '../src/game/timers.js';
import {sanitize} from '../src/sanitize.js';
import {elOf} from '../src/game/combat.js';
import {ch} from '../src/game/meta.js';

let fails=0;const ok=(c,m)=>{console.log((c?'✓ ':'✗ ')+m);if(!c)fails++};
const real=Date.now;let off=0;Date.now=()=>real()+off;const wait=ms=>{off+=ms};
const fresh=(o={})=>{setS({...def(),tut:3,...o});S.disc=S.disc.map((_,i)=>i<10?1:0);T.evCheck()};
const roundtrip=()=>{const j=JSON.parse(JSON.stringify(S));setS({...def(),...j});sanitize(def())};

// --- Spedizioni
fresh();S.g=[5,4,3,...Array(25).fill(0)];
ok(T.expStart(1)&&S.exp.run.length===1,'spedizione: parte (4h)');
ok(!T.expStart(0),'una sola spedizione alla volta');
const e0=S.exp.run[0],et0=e0.et;
roundtrip();ok(S.exp.run.length===1&&S.exp.run[0].et===et0&&S.exp.run[0].st===e0.st,'ricarica la pagina: l\'orario della spedizione NON si azzera');
ok(T.expClaim(0)===null,'prima del tempo non si riscuote');
wait(4*3600e3+1000);const c0=S.c,r=T.expClaim(0);
ok(r&&r.c>0&&S.c===c0+r.c&&S.exp.run.length===0,'a tempo scaduto si riscuote ('+(r&&r.c)+' monete)');
ok(r.c<=inc()*4*3600,'premio spedizione 4h mai oltre il guadagno pieno di 4 ore ('+r.c+' vs '+Math.floor(inc()*4*3600)+')');
for(const q of [0,1,2]){fresh();S.g=[8,7,6,5,4,3,2,1,...Array(20).fill(0)];const v=T.expVal(q,T.expPow());ok(v<=inc()*T.EXP[q].dur/1000&&v>0,'spedizione '+q+': premio tra 0 e il guadagno pieno del periodo');}
ok(r.e===0,'senza progressi la spedizione non regala Essenze fisse');
fresh();S.g=[];ok(!T.expStart(0),'senza mostri in squadra non si parte');
fresh();S.g=[6,6,...Array(26).fill(0)];T.expStart(2);wait(20*3600e3);roundtrip();ok(S.exp.run[0]&&T.expLeft(S.exp.run[0])===0,'dopo molte ore resta riscuotibile');

// --- Uova
fresh({c:1e9});S.g=[5,4,3,...Array(25).fill(0)];
ok(T.nidBuy(1)&&!T.nidBuy(1),'uovo: un solo uovo per tipo');
const st0=S.inc.r[0].st;roundtrip();ok(S.inc.r.length===1&&S.inc.r[0].st===st0,'ricarica: il nido non riparte');
ok(T.nidHatch(0)===null,'uovo non pronto: nessun premio');
wait(2*3600e3);ok(T.nidLeft(S.inc.r[0])===0&&S.inc.r.length===1,'uovo pronto ma NON si schiude da solo (resta da riscuotere)');
ok(T.bells().some(b=>b.a==='hb'),'la campanella segnala l\'uovo pronto');
const c1=S.c;const h=T.nidHatch(0);ok(h&&S.c>c1-1&&S.inc.r.length===0&&S.inc.h===1,'riscossione: monete e conteggio schiuse');
ok(h.e===0,'uova: nessuna Essenza fissa senza progressi');
fresh({c:1e9});ok(T.nidBuy(0)&&!T.nidBuy(1),'un solo nido libero all\'inizio (gli altri si aprono schiudendo uova)');
S.inc.h=8;S.inc.nes=3;ok(T.nidMax()===3,'nidi: 3 nidi dopo 8 schiuse');
fresh({c:1e9});S.inc.nes=1;for(let k=0;k<8;k++){S.inc.r=[];T.nidBuy(0);wait(11*60e3);T.nidHatch(0)}ok(S.inc.h===8&&T.nidMax()===3,'8 schiuse vere aprono il 3° nido (nidMax)');
fresh({c:0});ok(!T.nidBuy(2),'senza monete non si incuba');
// uovo con 2 schiuse prima: tipi diversi
fresh({c:1e9});S.inc.h=8;S.inc.nes=3;T.nidBuy(0);T.nidBuy(1);T.nidBuy(2);ok(S.inc.r.length===3,'3 nidi con 3 tipi diversi');

// --- Serie lunga
fresh();S.dl.st=7;T.claimLong();roundtrip();ok(S.dl.cl.includes(7),'ricarica: i traguardi serie già riscossi restano segnati (niente premi doppi)');
fresh();S.dl.st=6;ok(T.claimLong().length===0,'serie 6: nessun traguardo');
S.dl.st=7;let g=T.claimLong();ok(g.length===1&&g[0].d===7&&T.grDone(7),'serie 7: traguardo consegnato');
ok(T.claimLong().length===0,'e non due volte');
S.dl.st=28;g=T.claimLong();ok(g.some(x=>x.mon)&&S.dl.mon===1&&S.dl.hp===1,'serie 28: Drago del Tempo e insegna');
ok(S.disc.length===39&&S.disc.lastIndexOf(1)+1<=39,'il Drago NON finisce tra i 39 mostri (statistiche e trofei restano giusti)');
ok(Math.abs(T.stMul()-1.03)<1e-9,'bonus permanente della serie: +1% insegna +2% drago');
const i0=inc();S.dl.mon=0;S.dl.hp=0;ok(inc()<i0,'il bonus entra davvero nei guadagni');

// --- Evento settimanale
fresh();ok(T.evOn()&&S.ev.m&&S.ev.m.t>=2&&S.ev.m.t<=S.disc.lastIndexOf(1)+1,'evento: campione vicino al tuo migliore ('+S.ev.m.t+')');
T.evAdd(1);ok(S.ev.p===1&&S.ev.tot===1&&!T.evMileOk(0),'1 💠: il primo traguardo non è ancora raggiunto');
T.onProg('event',1);ok(S.ev.p===1+T.EV_CATCH,'👻💎 catturato: +'+T.EV_CATCH+' 💠');
T.onProg('dmis',1);T.onProg('wmis',1);ok(S.ev.p===1+T.EV_CATCH+T.EV_DM+T.EV_WM,'missioni riscosse: +'+T.EV_DM+' (giornaliera) e +'+T.EV_WM+' (settimanale)');
{const p0=S.ev.p,t=[1,2,3,4,5,6,7,8,9].find(x=>elOf(x)===S.ev.el),o=[1,2,3,4,5,6,7,8,9].find(x=>elOf(x)!==S.ev.el);for(let k=0;k<T.EV_MRG;k++)T.onMerge(o);ok(S.ev.p===p0,'unioni di altri elementi: niente 💠');
 for(let k=0;k<T.EV_MRG;k++)T.onMerge(t);ok(S.ev.p===p0+1,'ogni '+T.EV_MRG+' unioni dell\'elemento in festa: +1 💠')}
{S.ev.tot=T.EVM[1].p;const t0=ch().t;ok(T.evMileOk(0)&&T.evMileOk(1)&&!T.evMileOk(2),'traguardi raggiunti con i 💠 guadagnati');const r=T.evMile(0);ok(r&&r.t===T.EVM[0].t&&ch().t===t0+r.t&&!T.evMileOk(0)&&T.evMile(0)===null,'traguardo riscosso una volta sola, biglietti consegnati');
 const c0=S.c;T.evMile(1);ok(S.c>c0&&S.ev.b===2,'traguardo con monete')}
// Spedizione e uovo della festa: 45 min – 7 h (sotto le 8 h), 💠 per l'evento, un video toglie 5 minuti
{fresh();ok(T.EVX.every(x=>x.dur>30*60e3&&x.dur<8*3600e3)&&T.EVN.dur>30*60e3&&T.EVN.dur<8*3600e3,'durate della festa tra 30 minuti e 8 ore');
 ok(T.EVX[0].pt/T.EVX[0].dur>T.EVX[2].pt/T.EVX[2].dur,'le spedizioni corte rendono un po\' di più all\'ora (chi torna spesso)');
 ok(T.evxStart(1)&&!T.evxStart(0),'una spedizione della festa alla volta');const et=S.ev.fx.et;T.evSpeed('fx');ok(et-S.ev.fx.et===5*60e3,'video: -5 minuti (non un\'ora)');
 ok(T.evxClaim()===0,'non si riscuote prima della fine');const p0=S.ev.p;S.ev.fx.et=Date.now()-1;ok(T.evxClaim()===T.EVX[1].pt&&S.ev.p===p0+T.EVX[1].pt&&S.ev.fx===null,'al ritorno: 💠 per l\'evento');
 S.c=1e12;const c0=S.c;ok(T.evnBuy()&&S.c<c0&&!T.evnBuy(),'uovo della festa: costa monete, uno alla volta');S.ev.fn.et=Date.now()-1;ok(T.evnClaim()===T.EVN.pt,'uovo schiuso: 💠 +'+T.EVN.pt);
 T.evxStart(2);const w=S.ev.wk;S.ev.wk=w-1;T.evCheck();ok(S.ev.fx&&S.ev.fx.q===2,'cambio settimana: la spedizione in corso non si perde')}
const bb=S.ev.b;S.ev.p=300;S.ev.sp={};ok(T.evBuy(1)&&S.ev.p===300-T.evPrice(1),'negozio: acquisto scala i 💠');
ok(S.ev.b===bb,'spendere 💠 non cancella le spille guadagnate');
T.evAdd(0);ok(!T.evCan(1),'oggetto già comprato questa settimana');
// boost: 60 minuti, non 1000 ore
fresh();S.ev.p=500;S.boost=0;T.evBuy(0);ok(S.boost-Date.now()<=61*60e3&&S.boost-Date.now()>59*60e3,'⚡ dà 60 minuti di x2 (non 1000 ore)');
// campione = UN mostro, non tutto il laboratorio
fresh();S.g=[3,2,...Array(26).fill(0)];S.ev.p=500;const n0=S.g.filter(Boolean).length;ok(T.evBuy(5)&&S.g.filter(Boolean).length===n0+1,'⭐ aggiunge UN mostro (non riempie la griglia)');
fresh();S.g=Array(28).fill(2);S.ev.p=500;ok(!T.evCan(5),'⭐ non si compra a laboratorio pieno');
// scorrimento del campione
fresh();S.ev.m.left=3600e3;T.evClock(1800e3);ok(S.ev.m.left===1800e3,'il tempo del campione scorre');
// nuova settimana: azzera e dà l'uovo a chi ha partecipato
fresh();T.evAdd(3);const w=S.ev.wk;S.ev.wk=w-1;S.ev.ok=1;T.evCheck();
ok(S.ev.wk===w&&S.ev.p===0&&S.ev.tot===0&&S.ev.got===1&&S.inc.r.length===1,'nuova settimana: reset e uovo pronto per chi ha partecipato');
fresh();S.ev.wk=-1;T.evCheck();ok(S.ev.got===0&&S.inc.r.length===0,'primo avvio: nessun uovo regalato');
// bonus elemento
fresh();S.g=[4,4,...Array(26).fill(0)];const el=S.ev.el;S.ev.el=0;const b1=T.elBonus();S.ev.el=1;const b2=T.elBonus();ok(b1===1.2&&b2===1,'bonus elemento: +20% se metà del laboratorio è in festa');

// --- Ordini
fresh();S.g=[8,7,6,5,4,3,2,1,...Array(20).fill(0)];T.ordTick();
ok(T.ordList().length===2&&T.ordList().every(o=>!o.d&&!o.c),'ordini: 2 aperti e NON già soddisfatti alla nascita');
ok(T.ordList().every(o=>o.t<=T.ordReach()&&o.et>Date.now()&&o.ic),'ordini: livello raggiungibile, scadenza e icona presenti');
const o=T.ordList()[0];roundtrip();ok(T.ordList()[0].et===o.et&&T.ordList()[0].ic===o.ic,'ricarica: l\'ordine conserva scadenza e icona');
T.onMerge(o.t-1);ok(!T.ordList()[0].d||o.k==='at'&&false,'un\'unione di livello più basso non lo completa');
const hit=T.onMerge(o.t);ok(hit&&T.ordList()[0].d===1&&T.ordOk(T.ordList()[0]),'un\'unione del livello giusto lo completa');
const c2=S.c;const cl=T.ordClaim(0);ok(cl&&S.c===c2+cl.c,'riscossione: monete');
T.ordTick();ok(T.ordList().filter(x=>!x.c).length===1,'dopo la riscossione il posto resta vuoto per qualche minuto (niente ordini a raffica)');
wait(T.ORD_WAIT+1);T.ordTick();ok(T.ordList().filter(x=>!x.c).length===2,'passata la pausa arriva un nuovo ordine (la lista non si esaurisce)');
wait(5*60e3+1);T.ordTick();ok(T.ordList().filter(x=>x.c===2).length>=1,'scaduti: chiusi');
wait(T.ORD_WAIT+1);T.ordTick();ok(T.ordList().filter(x=>!x.c).length===2,'scaduti: sostituiti da nuovi dopo la pausa');
wait(5e3);T.ordTick();ok(T.ordList().every(x=>!x.c||Date.now()-x.ct<4500),'gli ordini chiusi escono dalla lista dopo qualche secondo');
fresh({tut:1});S.g=[3,2,1,...Array(25).fill(0)];T.ordTick();ok(T.ordList().length===0,'niente ordini nel tutorial');
fresh();S.g=[3,...Array(27).fill(0)];T.ordTick();ok(T.ordList().every(x=>x.t>=2&&x.t<=T.ordReach()),'con pochi mostri gli ordini restano realizzabili');
// anti-esploit: anche riscuotendo ogni ordine appena possibile, gli ordini restano un extra contenuto
fresh();S.g=[8,7,6,5,4,3,2,1,...Array(20).fill(0)];{const t0=Date.now();let tot=0;for(let k=0;k<30;k++){T.ordTick();for(const o of T.ordList()){if(!o.c){o.d=1;const r=T.ordClaim(T.ordList().indexOf(o));if(r)tot+=r.c}}wait(60e3)}
 const mins=(Date.now()-t0)/60e3;ok(tot/(inc()*mins*60)<.5,'ordini: in '+mins+' minuti rendono meno del 50% del guadagno pieno ('+Math.round(tot/(inc()*mins*60)*100)+'%)')}
// quattro scaduti di fila: grado più basso
fresh();S.g=[8,7,6,5,4,3,2,1,...Array(20).fill(0)];S.ord.tier=3;T.ordTick();for(let k=0;k<2;k++){wait(5*60e3+1);T.ordTick();wait(T.ORD_WAIT+1);T.ordTick()}wait(5*60e3+1);T.ordTick();ok(S.ord.tier===2,'4 ordini scaduti di fila: scende un grado (grado '+S.ord.tier+')');
// prestigio: gli ordini aperti non sopravvivono, il resto sì
fresh();S.g=[8,7,6,5,4,3,2,1,...Array(20).fill(0)];T.ordTick();S.ord.n=5;S.ord.tier=3;T.expStart(0);
const p=prestigeState(S,1);ok(p.ord.list.length===0&&p.ord.n===5&&p.ord.tier===3&&p.exp.run.length===1,'prestigio: ordini aperti azzerati, grado e spedizioni restano');

// --- Pubblicità: spedizioni -1 ora, nidi -5 minuti
fresh();S.g=[5,4,3,...Array(25).fill(0)];T.expStart(1);const l0=T.expLeft(S.exp.run[0]);T.expSpeed(0);ok(Math.abs(l0-T.expLeft(S.exp.run[0])-3600e3)<50,'acceleratore spedizione: -1h');
S.c=1e9;T.nidBuy(1);const nl=T.nidLeft(S.inc.r[0]);T.nidSpeed(0);ok(Math.abs(nl-T.nidLeft(S.inc.r[0])-300e3)<50,'acceleratore uovo nel nido: -5 minuti');

// --- Salvataggio rovinato
fresh();S.exp={run:[{q:9,st:'a',et:null,v:'x'},null,5]};S.inc={r:[{t:99},{t:1,st:Date.now()*3}],h:'q',nes:9,k:'z'};S.ord={list:[{t:'a',k:5},7],n:null};S.ev={wk:'x',m:5,sp:{a:'b'},cl:'q'};
let thrown=null;try{sanitize(def())}catch(e){thrown=e}
ok(!thrown&&S.exp.run.every(e=>Number.isFinite(e.et)&&e.q>=0&&e.q<=2),'salvataggio rovinato: spedizioni riparate ('+(thrown?thrown.message:S.exp.run.length+' voci')+')');
ok(S.inc.r.every(n=>n.st<=Date.now())&&T.ordList().every(x=>Number.isFinite(x.et)),'uova e ordini riparati, nessun orario nel futuro');
ok(Number.isFinite(inc())&&inc()>=0,'i guadagni restano numeri validi');
process.exit(fails?1:0);

// Test delle regole di gioco (senza interfaccia): soft cap delle Essenze, tasso offline, elementi, combattimento offline.
//   npm test   (insieme al controllo dell'economia)
import {S,setS,def} from '../src/core/state.js';
import {essBonus,essMult,offRate,slots,freeCell,UP} from '../src/game/economy.js';
import {ELM,elOf,fightTime,offBattle,tAtk,tHp,advM,eEl,squad} from '../src/game/combat.js';
import {BN,N} from '../src/data/config.js';
import {PK,PKR,pkrCost,mult,spCost,prestigeState} from '../src/game/economy.js';
let fails=0;const ok=(c,m)=>{console.log((c?'✓ ':'✗ ')+m);if(!c)fails++};
const fresh=(o={})=>{setS({...def(),...o});S.tut=3};

// Essenze: lineari fino a 50, poi crescita più lenta ma sempre crescente e senza salti
ok(essBonus(10)===1&&essBonus(50)===5,'fino a 50 Essenze: +10% ciascuna');
ok(Math.abs(essBonus(50.0001)-essBonus(50))<1e-3,'nessun salto al passaggio del soft cap');
let mono=true;for(let e=0;e<2e6;e=e*1.3+1)if(essBonus(e+1)<=essBonus(e))mono=false;ok(mono,'il bonus continua a crescere con le Essenze');
ok(essMult(64000)<500&&essMult(7.7e6)<2e4,'senza esplosione: 64.000 Essenze → ×'+Math.round(essMult(64000))+', 7,7 milioni → ×'+Math.round(essMult(7.7e6))+' (prima ×6.400 e ×770.000)');

// Offline: mai oltre il gioco attivo
fresh();S.up.o=UP.find(u=>u.k==='o').max;S.pk.o=PK.find(p=>p.k==='o').max;ok(Math.abs(offRate()-(.25+2+1))<1e-9,'tasso offline al massimo: '+offRate().toFixed(2)+' (Sonno profondo +200%, Sonno lungo +100%)');

// Elementi propri di ogni mostro
ok(ELM.length>=26&&ELM.every(e=>e===0||e===1||e===2),'26 mostri, ognuno con un elemento valido');
ok(new Set([4,5,6].map(elOf)).size===3,'i livelli 4, 5 e 6 coprono i tre elementi (le abilità si sbloccano presto)');
ok([0,1,2].every(e=>ELM.filter(x=>x===e).length>=8),'elementi ben distribuiti: '+[0,1,2].map(e=>ELM.filter(x=>x===e).length).join('/'));
ok(elOf(1)!==elOf(2)||elOf(2)!==elOf(3),'l\'elemento non è più ciclico sul livello');

// Celle
fresh();ok(slots()===BN&&N>BN,'celle iniziali '+BN+', massimo '+N);S.up.c=UP.find(u=>u.k==='c').max;ok(slots()===N,'con il potenziamento massimo tutte le '+N+' celle');
fresh();for(let i=0;i<BN;i++)S.g[i]=1;ok(freeCell()<0,'celle piene → nessuna cella libera tra quelle sbloccate (le altre restano chiuse)');S.up.c=1;ok(freeCell()===BN,'una cella in più → si apre la numero '+(BN+1));

// Combattimento offline
fresh({st:1,bs:1});S.g[0]=S.g[1]=S.g[2]=S.g[3]=10;
const c0=S.c,b=offBattle(3600);ok(b.n>0&&S.bs===S.st&&S.st===1+b.n&&S.c>c0,'1h offline con squadra forte: '+b.n+' livelli vinti, monete +'+Math.round(S.c-c0));
fresh({st:30,bs:30});S.g[0]=1;ok(offBattle(8*3600).n===0&&S.st===30,'squadra debole contro un livello alto: nessun progresso offline');
fresh({st:1,bs:1,fm:1});S.g[0]=S.g[1]=S.g[2]=S.g[3]=10;const bf=offBattle(600);ok(bf.n>0&&S.st===1&&S.bs===1,'in modalità farm resta sullo stesso livello ('+bf.n+' vittorie)');
fresh({st:1,bs:1});S.g[0]=S.g[1]=S.g[2]=S.g[3]=10;const slow=offBattle(60).n;fresh({st:1,bs:1});S.g[0]=S.g[1]=S.g[2]=S.g[3]=10;
let on=0;{const st0=S.st;let t=0;while(t<60&&on<1e3){const T=fightTime(S.st);if(!isFinite(T))break;t+=T+1;on++;S.st++}}
ok(slow<=on,'offline più lento che online ('+slow+' vs '+on+' livelli in 60s)');

// Il boss con il colpo a terra è più duro dello stesso livello senza (stessa squadra)
fresh({st:20,bs:20});S.g[0]=S.g[1]=S.g[2]=S.g[3]=13;const tb=fightTime(20);ok(isFinite(tb)&&tb>3,'boss al livello 20: la squadra tier 13 vince in '+tb.toFixed(1)+'s');

// La vita cresce con le Essenze, ma meno dell'attacco
fresh();S.g[0]=S.g[1]=S.g[2]=S.g[3]=12;const h0=tHp(),a0=tAtk(1);S.essT=1000;ok(tHp()/h0>5&&tAtk(1)/a0>tHp()/h0,'con 1000 Essenze: vita ×'+(tHp()/h0).toFixed(1)+', attacco ×'+(tAtk(1)/a0).toFixed(1));
// Rami infiniti dell'albero: costo crescente, effetti applicati, i vecchi salvataggi (senza i nuovi livelli) non cambiano
{let up=true;for(let l=0;l<80;l++)if(pkrCost(l+1)<=pkrCost(l))up=false;ok(up&&pkrCost(0)===3&&isFinite(pkrCost(300)),'rami infiniti: il costo cresce sempre (liv. 0 → '+pkrCost(0)+', liv. 30 → '+pkrCost(30)+')');
 ok(PKR.length===3&&PKR.every(p=>p.max>=1e9),'3 rami davvero infiniti (gli altri sono tra le radici)');
 fresh();const m0=mult(),c0=spCost();S.pk.x=10;ok(Math.abs(mult()/m0-1.2)<1e-9,'Alchimia ×10 livelli: +20% guadagni');S.pk.x=0;S.pk.e=10;ok(spCost()<c0&&spCost()>=Math.floor(c0*.8),'Mercato nero: uova più economiche ('+c0+' → '+spCost()+')');
 fresh();S.g[0]=S.g[1]=S.g[2]=S.g[3]=10;const ta=tAtk(1),th=tHp();S.pk.t=10;S.pk.h=10;ok(Math.abs(tAtk(1)/ta-1.1)<1e-9&&Math.abs(tHp()/th-1.1)<1e-9,'Furia e Armatura: +10% attacco e vita con 10 livelli');
 fresh();const base0=mult();delete S.pk.x;ok(mult()===base0,'senza i nuovi livelli nel salvataggio nulla cambia (nessun NaN)');
 // con le Essenze accumulate in 48 ore (85.000) i rami le assorbono: livelli raggiunti dividendole in parti uguali
 let e=85000,lv=Array(5).fill(0);while(true){const k=lv.indexOf(Math.min(...lv)),c=pkrCost(lv[k]);if(e<c)break;e-=c;lv[k]++}
 ok(Math.min(...lv)>=20,'85.000 Essenze finiscono nei rami: livelli '+lv.join('/')+' (prima restavano inutilizzate)')}
// --- formattazione numeri: mai «1000.0K»
{const {fmt}=await import('../src/core/util.js');
 ok(fmt(999949)==='999.9K'&&fmt(999950)==='1.00M'&&fmt(999999)==='1.00M'&&fmt(999999999)==='1.00B','fmt: i numeri a ridosso della soglia passano al suffisso successivo');
 let bad=[];for(let k=0;k<2000;k++){const n=Math.pow(10,Math.random()*36);const f=fmt(n);if(/^1000(\.\d)?[A-Za-z]/.test(f))bad.push(f)}
 ok(bad.length===0,'fmt: nessun «1000.x» su 2000 numeri casuali '+bad.slice(0,2))}
// Boost x2: raddoppia il reddito attivo, ma non i premi «N minuti di guadagni» né la battaglia offline
{const {inc,incBase,rBase,eggInt}=await import('../src/game/economy.js');
 fresh();S.g=[8,8,7,0];const r0=rBase(),i0=inc(),b0=offBattle(3600).n;
 fresh();S.g=[8,8,7,0];S.boost=Date.now()+60000;
 ok(Math.abs(inc()/i0-2)<1e-9&&Math.abs(incBase()-i0)<1e-9,'il boost raddoppia inc() ma non incBase()');
 ok(Math.abs(rBase()-r0)<1e-9,'premi in minuti di guadagni uguali con e senza boost');
 const b1=offBattle(3600).n;ok(b1===b0&&S.boost>Date.now(),'battaglia offline senza boost ('+b0+' / '+b1+' livelli) e boost ripristinato dopo');
 fresh();S.up.f=3;ok(eggInt()===0,'incubatrice spenta finché non si sblocca con le Essenze');S.ae=1;S.up.f=0;ok(eggInt()===60,'incubatrice sbloccata: un uovo ogni 60s');S.up.f=1;ok(Math.abs(eggInt()-59.9)<1e-9,'ogni livello: 0,1s in meno');S.up.f=UP.find(u=>u.k==='f').max;ok(eggInt()===5,'al massimo: un uovo ogni 5s');
 S.up.f=UP.find(u=>u.k==='f').max;ok(eggInt()===5,'incubatrice al massimo: un uovo ogni '+eggInt().toFixed(1)+'s')}
{fresh();const t=Date.now()+200e3;S.boost=t;S.amAd=t;S.run=4e5;const x=prestigeState(S,2);
 ok(x.boost===t&&x.amAd===t&&x.ess===S.ess+2,'Evocazione oscura: x2 e «Unione 5 minuti» guadagnati con un video non si perdono')}
{fresh();const {mult:m0}=await import('../src/game/economy.js');const a=m0();S.up.l=10;ok(Math.abs(m0()/a-1.5)<1e-9,'Laboratorio: +5% a livello (10 livelli = ×1,5)');
 S.up.l=0;S.sp=150;const c0=spCost();S.up.d=10;ok(Math.abs(spCost()/c0-.95)<.01,'Sconto uova: -0,5% a livello');S.up.d=UP.find(u=>u.k==='d').max;ok(Math.abs(spCost()/c0-.01)<.01,'Sconto uova al massimo: -99%');
 let ok2=true;for(const u of UP)for(let l=0;l<Math.min(u.max,60);l++)if(!(u.cost(l+1)>u.cost(l)))ok2=false;ok(ok2,'i costi dei potenziamenti crescono sempre')}
process.exit(fails?1:0);

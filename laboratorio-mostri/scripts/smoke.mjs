// Test di fumo dell'interfaccia (jsdom, orologio virtuale): richiede prima `npm run build`.
// Prova impostazioni, lingua, statistiche, reset, schede mostri, missioni e i punti in cui parte l'interstitial.
import {JSDOM} from 'jsdom';import fs from 'fs';import {fileURLToPath} from 'node:url';
const P=fileURLToPath(new URL('..',import.meta.url)).replace(/\/$/,'');
const js=(()=>{const d=P+'/dist/assets/';return fs.readFileSync(d+fs.readdirSync(d).find(f=>f.endsWith('.js')),'utf8')})();
const html=fs.readFileSync(P+'/index.html','utf8').replace(/<script[\s\S]*?<\/script>/g,'');
let fails=0;const ok=(c,m)=>{console.log((c?'✓ ':'✗ ')+m);if(!c)fails++};
async function boot(save,{bridge=false,lang='it'}={}){
 let clock=1.8e12,seed=7;const timers=[];let id=1;const calls=[];
 const dom=new JSDOM(html,{runScripts:'outside-only',pretendToBeVisual:true,url:'https://x.test/'});const w=dom.window;
 const D=w.Date;w.Date=class extends D{constructor(...a){a.length?super(...a):super(clock)}static now(){return clock}};
 w.Math.random=()=>{seed=(seed*1664525+1013904223)%4294967296;return seed/4294967296};
 w.setInterval=(f,ms)=>{timers.push({id,f,ms,t:clock+ms,rep:1});return id++};w.setTimeout=(f,ms)=>{timers.push({id,f,ms,t:clock+(ms||0),rep:0});return id++};
 w.clearTimeout=w.clearInterval=i=>{const k=timers.findIndex(x=>x.id===i);if(k>=0)timers.splice(k,1)};
 const errs=[];w.addEventListener('error',e=>errs.push(String(e.message)));
 if(bridge)w.bridge={initialize:async()=>{},platform:{language:lang,on(){},sendMessage(){},isAudioEnabled:true},advertisement:{on(){},showInterstitial:p=>{calls.push(p);return Promise.resolve()},showRewarded:()=>Promise.resolve()},storage:{get:async()=>null,set:async()=>{}},EVENT_NAME:{}};
 if(save)w.localStorage.setItem('ml_save_v1',JSON.stringify({ls:clock-1000,...save}));
 w.eval(js);const flush=()=>new Promise(r=>setImmediate(r));
 const adv=async ms=>{const end=clock+ms;for(;;){let n=null;for(const t of timers)if(t.t<=end&&(!n||t.t<n.t))n=t;if(!n)break;clock=Math.max(clock,n.t);if(n.rep)n.t+=n.ms;else timers.splice(timers.indexOf(n),1);try{n.f()}catch(e){errs.push('T:'+e.stack)}await flush()}clock=end};
 await flush();await flush();await adv(500);
 const $=i=>w.document.getElementById(i);const click=el=>{if(!el)throw new Error('no el');el.dispatchEvent(new w.MouseEvent('click',{bubbles:true}))};
 const S=()=>JSON.parse(w.localStorage.getItem('ml_save_v1'));
 return {jump:ms=>{clock+=ms;timers.forEach(x=>x.t+=ms)},w,$,click,adv,errs,calls,S,flush,q:(s)=>w.document.querySelector(s),qa:s=>[...w.document.querySelectorAll(s)]};
}
const base={c:5e5,g:[3,3,4,2,2,1,0,5,0,6,1,1,0,0,2,4,0,0,0,0],sp:30,up:{l:3,d:2,o:1,a:2},ess:4,run:3e6,boost:0,st:8,disc:[1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],tut:3,dl:{d:-1,m:[],last:-1,st:2,dbl:1,lr:null},essT:4,lt:2e7,wd:1,pk:{s:1,a:1,o:0,g:1,b:1},ach:{mg:60,sp:120,ev:3,pr:1,wn:3,ch:2},sq:[]};

// --- impostazioni, lingua, audio, statistiche, reset
{const t=await boot({...base,snd:0});
 ok(t.S().sfxOn===0&&t.S().musOn===0&&t.S().snd===undefined,'vecchio salvataggio snd:0 → effetti e musica spenti');
 t.click(t.$('tSet'));ok(t.$('set').classList.contains('on'),'impostazioni si aprono');
 t.click(t.q('[data-a=lang][data-v=it]'));await t.adv(300);const itN=t.$('n1').textContent;
 t.click(t.q('[data-a=lang][data-v=en]'));await t.adv(300);ok(t.$('n1').textContent!==itN&&/Battle/.test(t.$('n1').textContent),'cambio lingua applicato subito ('+itN+' → '+t.$('n1').textContent+')');
 ok(t.S().lp==='en','lingua salvata nella preferenza');
 t.click(t.q('[data-a=au][data-v=musOn]'));ok(t.S().musOn===1&&t.S().sfxOn===0,'musica si accende da sola');
 t.click(t.q('[data-a=stat]'));ok(t.$('stat').classList.contains('on')&&!t.$('set').classList.contains('on'),'statistiche aperte dalle impostazioni');
 ok(t.qa('#statB .rw').length===18,'18 righe di statistiche: '+t.qa('#statB .rw').map(r=>r.textContent).slice(0,3).join(' | '));
 t.click(t.$('statClose'));
 // reset con conferma
 t.click(t.$('tSet'));const c0=t.S().c;t.click(t.q('[data-a=rs]'));ok(!!t.q('[data-a=rsOk]'),'il reset chiede conferma');
 t.click(t.q('[data-a=rsNo]'));ok(!t.q('[data-a=rsOk]')&&t.S().c===c0,'«Annulla» non cancella nulla');
 t.click(t.q('[data-a=rs]'));t.click(t.q('[data-a=rsOk]'));await t.adv(300);
 const s=t.S();ok(s.c<100&&s.st===1&&s.tut===0&&s.lp==='en'&&s.musOn===1,'reset: progressi azzerati, tutorial da capo, lingua e audio mantenuti (monete '+Math.floor(s.c)+', livello '+s.st+')');
 ok(t.errs.length===0,'nessun errore JS '+t.errs.slice(0,2));}

// --- collezione con storie, missioni e missione settimanale
{const t=await boot({...base},{});
 t.click(t.$('tCol'));const cell=t.q('.cm[data-a=mon]');ok(!!cell,'i mostri scoperti sono toccabili');t.click(cell);
 const card=t.q('#colB .mi');ok(!!card&&card.textContent.length>40,'scheda del mostro: '+(card&&card.textContent.slice(0,70)));
 t.click(t.q('.cm[data-a=mon][data-t="2"]'));ok(/Microbo|Germ/.test(t.q('#colB .mi').textContent),'cambio scheda sul mostro 2');
 t.click(t.$('cClose'));
 const s=t.S();ok(s.dl.m.length===3&&s.dl.m[0].t==='merge'&&!!s.dl.w&&s.dl.w.n>0,'3 missioni giornaliere + settimanale: '+s.dl.m.map(m=>m.t).join(',')+' / '+s.dl.w.t);
 t.click(t.$('tDaily'));ok(!!t.q('#dBody .ms.wk'),'la missione settimanale è nella schermata');
 // le missioni cambiano nei giorni: tutti i tipi sono generabili e il testo esiste
 t.click(t.$('dClose'));
 ok(t.errs.length===0,'nessun errore JS '+t.errs.slice(0,2));}

// --- interstitial: non più ogni 40 unioni; solo prestigio e cambio mondo
{const t=await boot({...base,g:[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],run:9e9},{bridge:true});
 const cells=t.qa('#grid .c');
 for(let r=0;r<2;r++){for(let i=0;i<20;i+=2){t.click(cells[i]);t.click(cells[i+1])}
  // rimetti tutti a livello 1 tramite nuovi mostri non possibile: ripeti unioni di livello 2
 }
 for(let r=0;r<80&&t.S().ach.mg-60<45;r++){t.click(t.$('spawn'));for(let i=0;i<20;i++)for(let j=i+1;j<20;j++){t.click(cells[i]);t.click(cells[j])}}
 const merges=t.S().ach.mg-60;ok(merges>=10&&t.calls.length===0,'dopo '+merges+' unioni nessun interstitial ('+t.calls.length+')');
 t.click(t.$('pr'));ok(t.calls.join()==='prestige','Evocazione oscura → interstitial «prestige» ('+t.calls+')');}
{const t=await boot({...base,g:[13,13,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],disc:Array(26).fill(0).map((_,i)=>i<13?1:0)},{bridge:true});
 const cells=t.qa('#grid .c');t.click(cells[0]);t.click(cells[1]);await t.adv(300);
 ok(t.$('wb').classList.contains('on')&&t.calls.length===0,'nuovo mondo: finestra aperta, ancora nessun interstitial');
 t.click(t.q('#wb [data-a=wc]'));ok(t.calls.join()==='world','alla chiusura del cambio mondo → interstitial «world» ('+t.calls+')');
 ok(t.errs.length===0,'nessun errore JS '+t.errs.slice(0,2));}
// --- messaggi con varianti
{const t=await boot({...base,g:Array(20).fill(1).map((_,i)=>i%2?2:3)},{});
 const seen=new Set();for(let i=0;i<30;i++){t.click(t.$('spawn'));await t.adv(2600);seen.add(t.$('toast').textContent)}
 ok(seen.size>=2,'messaggio «laboratorio pieno» con varianti: '+[...seen].slice(0,3).join(' / '));}

// --- migrazione e celle del laboratorio
{const t=await boot({...base,g:[1,1,...Array(18).fill(0)],sq:[]},{});await t.adv(5200);
 ok(t.S().bs===8,'vecchio salvataggio: lo stadio raggiunto diventa «migliore» ('+t.S().bs+')');
 const vis=()=>t.qa('#grid .c').filter(c=>c.style.display!=='none').length;
 ok(t.qa('#grid .c').length===28&&vis()===20,'28 celle create, 20 visibili ('+vis()+')');
 t.click(t.$('u4'));ok(t.S().up.c===1&&vis()===21,'«Laboratorio ampliato»: +1 cella ('+vis()+')');
 t.click(t.$('pr'));await t.adv(300);ok(t.S().bs>=8&&t.S().up.c===0&&vis()===20,'dopo l\'Evocazione oscura: livello migliore tenuto, celle di nuovo 20');
 ok(t.errs.length===0,'nessun errore JS '+t.errs.slice(0,2));}

// --- farm, ritirata e avanzamento
const z=n=>Array(n).fill(0);
{const t=await boot({...base,g:[8,8,8,8,...z(16)],st:5,bs:9,fm:1,essT:0,ess:0,pk:{s:0,a:0,o:0,g:0,b:0}},{});t.click(t.$('n1'));await t.adv(500);
 ok(/·\s*🏁9/.test(t.$('stg').textContent),'il livello migliore è mostrato accanto a quello attuale: '+t.$('stg').textContent);
 t.click(t.$('fmB'));ok(t.S().fm===0,'«Farm» si spegne');t.click(t.$('fmB'));ok(t.S().fm===1,'e si riaccende');
 t.click(t.$('stPrev'));ok(t.S().st===4&&t.S().fm===1,'◀ torna al livello 4 e attiva il farm');
 t.click(t.$('stNext'));ok(t.S().st===5,'▶ risale al livello 5');
 t.S().bs;ok(t.$('stNext').disabled===false,'▶ attivo finché c\'è un livello più alto già raggiunto');}
{const t=await boot({...base,g:[8,8,8,8,...z(16)],st:3,bs:3,fm:1,essT:0,ess:0,pk:{s:0,a:0,o:0,g:0,b:0}},{});t.click(t.$('n1'));const w0=t.S().ach.wn;await t.adv(12000);
 ok(t.S().st===3&&t.S().bs===3&&t.S().ach.wn>w0,'con il farm acceso si vince sempre lo stesso livello ('+(t.S().ach.wn-w0)+' vittorie, livello '+t.S().st+')');}
{const t=await boot({...base,g:[8,8,8,8,...z(16)],st:3,bs:3,fm:0,essT:0,ess:0,pk:{s:0,a:0,o:0,g:0,b:0}},{});t.click(t.$('n1'));await t.adv(12000);
 ok(t.S().st>3&&t.S().bs===t.S().st,'senza farm si avanza e il livello migliore sale ('+t.S().st+')');}
{const t=await boot({...base,g:[1,1,...z(18)],st:12,bs:12,fm:0,essT:0,ess:0,pk:{s:0,a:0,o:0,g:0,b:0},sq:[]},{});t.click(t.$('n1'));await t.adv(45000);
 ok(t.S().st<12&&t.S().bs===12,'sconfitte di fila → ritirata di un livello, record intatto (livello '+t.S().st+', record '+t.S().bs+')');
 ok(t.errs.length===0,'nessun errore JS '+t.errs.slice(0,2));}

// --- colpo a terra del boss: avviso e schivata
{const t=await boot({...base,g:[13,13,13,13,...z(16)],st:20,bs:20,fm:1,essT:0,ess:0,up:{l:0,d:0,o:0,a:0},pk:{s:0,a:0,o:0,g:0,b:0},sq:[]},{});t.click(t.$('n1'));
 let warned=false,dodged=false;
 for(let i=0;i<40;i++){await t.adv(250);if(t.$('en').classList.contains('warn')){warned=true;t.$('arena').dispatchEvent(new t.w.Event('pointerdown',{bubbles:true}))}
  if(/Dodged|Schivato/.test(t.$('arena').textContent))dodged=true}
 ok(warned,'il boss avvisa prima del colpo a terra');ok(dodged,'toccare l\'arena durante l\'avviso schiva il colpo');
 ok(t.errs.length===0,'nessun errore JS '+t.errs.slice(0,2));}

// --- bentornato con la battaglia che avanza da sola
{const clock0=1.8e12;const t=await boot({...base,g:[10,10,10,10,...z(16)],st:5,bs:5,fm:0,essT:0,ess:0,ls:clock0-7200e3},{});await t.adv(1500);
 ok(t.$('wb').classList.contains('on')&&/Stages won while away|Livelli vinti/.test(t.$('wbB').textContent),'la finestra «bentornato» mostra i livelli vinti mentre eri via: '+t.$('wbB').textContent.replace(/\s+/g,' ').slice(0,90));
 ok(t.S().bs>5,'il livello migliore è salito offline ('+t.S().bs+')');
 ok(t.errs.length===0,'nessun errore JS '+t.errs.slice(0,2));}
// --- punto 1: scudo serie, barra obiettivo, rami infiniti, festeggiamento, analytics
const dn=Math.floor((1.8e12-new Date().getTimezoneOffset()*60000)/864e5);
const dl0=o=>({d:-1,m:[],last:-1,st:0,dbl:1,lr:null,wk:-1,w:null,...o});
{const t=await boot({...base,dl:dl0({last:dn-2,st:5,sh:1})},{});
 t.click(t.$('tDaily'));ok(/Hai saltato|You missed/.test(t.$('dBody').textContent),'serie a rischio con scudo: la schermata avvisa che lo scudo la salva');
 t.click(t.q('#dBody [data-a=cd]'));ok(t.S().dl.st===6&&t.S().dl.sh===0,'saltato un giorno con lo scudo: la serie continua (6) e lo scudo si consuma');
 ok(t.errs.length===0,'nessun errore JS '+t.errs.slice(0,2));}
{const t=await boot({...base,dl:dl0({last:dn-2,st:5,sh:0})},{});
 t.click(t.$('tDaily'));t.click(t.q('#dBody [data-a=cd]'));ok(t.S().dl.st===1,'saltato un giorno senza scudo: la serie riparte da 1');}
{const t=await boot({...base,dl:dl0({last:dn-1,st:6,sh:0})},{});
 t.click(t.$('tDaily'));t.click(t.q('#dBody [data-a=cd]'));ok(t.S().dl.st===7&&t.S().dl.sh===1,'7° giorno di serie riscosso: lo scudo si ricarica');}
{const t=await boot({...base},{});
 ok(t.S().dl.sh===1&&t.S().pk.x===0&&t.S().an&&t.S().an.id.length>5,'vecchio salvataggio: scudo pronto, nuovi livelli a 0, ID analytics creato');
 ok(t.$('goal').classList.contains('on')&&/daily|giornaliero/i.test(t.$('goalT').textContent),'barra obiettivo: con il bonus pronto lo propone ('+t.$('goalT').textContent+')');
 t.click(t.$('goal'));ok(t.$('daily').classList.contains('on'),'toccando l\'obiettivo si apre la schermata giusta');}
{const q={...base,ess:0,col:Array(8).fill(1),dl:dl0({last:dn})};
 {const t=await boot({...q,ach:{...base.ach,pr:0}},{});
  ok(/Dark summoning|Evocazione oscura/.test(t.$('goalT').textContent),'senza premi da riscuotere e mai evocato: l\'obiettivo è la prima Evocazione oscura ('+t.$('goalT').textContent+')');}
 {const t=await boot(q,{});
  ok(/Discover|Scopri/.test(t.$('goalT').textContent)&&/level 7|livello 7/.test(t.$('goalT').textContent),'già evocato: l\'obiettivo è scoprire il prossimo mostro ('+t.$('goalT').textContent+')');}
 {const t=await boot({...q,disc:Array(26).fill(1)},{});
  ok(/boss/i.test(t.$('goalT').textContent),'tutti i mostri scoperti: l\'obiettivo è il boss ('+t.$('goalT').textContent+')');}}
{const t=await boot({...base,tut:1},{});
 ok(!t.$('goal').classList.contains('on'),'durante il tutorial la barra obiettivo è nascosta');}
{const t=await boot({...base,ess:500,essT:500,dl:dl0({last:dn})},{});
 t.click(t.$('ess'));ok(t.$('tree').classList.contains('on')&&t.qa('#tBody [data-a=pr]').length===6,'albero: 6 rami infiniti visibili');
 t.click(t.q('[data-a=pr][data-k=x]'));ok(t.S().pk.x===1&&t.S().ess===497,'un livello di Alchimia costa 3 🔮');
 t.click(t.q('[data-a=prm][data-k=t]'));const l=t.S().pk.t,cost=n=>Math.ceil(3*Math.pow(1.22,n));let sp=0;for(let i=0;i<l;i++)sp+=cost(i);
 ok(l>8&&t.S().ess===497-sp&&t.S().ess<cost(l),'«Max» compra finché bastano le Essenze: Furia livello '+l+', restano '+t.S().ess);
 ok(t.errs.length===0,'nessun errore JS '+t.errs.slice(0,2));}
{const t=await boot({...base,g:[8,8,...z(18)],disc:Array(26).fill(0).map((_,i)=>i<8?1:0),dl:dl0({last:dn})},{});
 const cells=t.qa('#grid .c');t.click(cells[0]);t.click(cells[1]);
 ok(t.$('cele').classList.contains('on')&&!!t.q('#cele .ci')&&t.qa('#cele .pt').length>0,'mostro nuovo: scheda di festeggiamento con particelle');
 ok(t.qa('#grid .pt').length>0,'unione: particelle sulla griglia (non cancellate dal ridisegno)');
 const an=t.S().an;ok(an.f.first_merge>0&&an.ss===1&&an.d.length===1,'analytics: prima unione registrata (a '+an.f.first_merge+'s), 1 sessione, 1 giorno');
 await t.adv(2600);ok(!t.$('cele').classList.contains('on'),'la scheda sparisce da sola');
 t.click(t.$('pr'));await t.adv(300);ok(t.S().an.id===an.id&&t.S().an.f.prestige>0,'analytics: ID e cronologia restano dopo l\'Evocazione oscura');
 ok(t.errs.length===0,'nessun errore JS '+t.errs.slice(0,2));}

// --- motivi per tornare (interfaccia): spedizioni, uova, ordini, evento, serie lunga
const dn2=Math.floor((1.8e12-new Date().getTimezoneOffset()*60000)/864e5);
{const t=await boot({...base,introSeen:1,dl:{d:-1,m:[],last:dn2,st:2,dbl:1,lr:null}},{});
 t.click(t.$('tExp'));await t.adv(300);ok(t.$('tm').classList.contains('on')&&t.qa('#tmB [data-a=xs]').length===3,'timer: il pannello si apre con 3 spedizioni (1h/4h/8h)');
 ok(!/undefined|NaN/.test(t.$('tmB').textContent),'timer: nessun testo mancante nel pannello');
 t.click(t.q('#tmB [data-a=xs][data-q="0"]'));await t.adv(300);ok(t.S().exp.run.length===1,'spedizione: parte');
 {t.click(t.$('tExp'));await t.adv(300);const btn=t.q('#tmB [data-a=xp]'),txt=t.q('#tmB .tt').textContent;await t.adv(3000);
  ok(t.q('#tmB [data-a=xp]')===btn,'timer: i pulsanti NON vengono ridisegnati a ogni secondo (un tocco non si perde)');ok(t.q('#tmB .tt').textContent!==txt,'timer: il conto alla rovescia scorre comunque');t.click(t.$('tmClose'))}
 const et=t.S().exp.run[0].et;t.click(t.$('tmClose'));await t.adv(6000);ok(t.S().exp.run[0].et===et,'la spedizione tiene il suo orario (nessun azzeramento)');
 t.jump(3700e3);await t.adv(800);ok(t.$('tExp').classList.contains('n'),'spedizione pronta: pallino rosso sul pulsante');
 const c0=t.S().c;t.click(t.$('tExp'));t.click(t.q('#tmB [data-a=xc]'));await t.adv(300);ok(t.S().exp.run.length===0&&t.S().c>c0,'riscossione della spedizione');
 t.click(t.q('#tmB [data-a=nb][data-k="1"]'));await t.adv(300);ok(t.S().inc.r.length===1,'uovo incubato nel nido');
 t.click(t.q('#tmB [data-a=np]'));await t.adv(300);ok(t.S().inc.r.length===1,'senza pubblicità disponibile il timer non scende');
 t.jump(3700e3);await t.adv(800);t.click(t.q('#tmB [data-a=nc]'));await t.adv(300);ok(t.S().inc.r.length===0&&t.S().inc.h===1,'uovo riscosso dopo 1h');
 ok(t.errs.length===0,'timer: nessun errore JS '+t.errs.slice(0,2));}
{const t=await boot({...base,introSeen:1,dl:{d:-1,m:[],last:dn2,st:2,dbl:1,lr:null}},{});await t.adv(1500);
 ok(t.S().ord&&t.S().ord.list.length===2&&t.S().ord.list.every(o=>!o.d&&!o.c&&o.et>0&&o.ic),'ordini: due richieste aperte, non già soddisfatte');
 t.click(t.$('tExp'));ok(/📜/.test(t.$('tmB').textContent)||t.qa('#tmB .ms').length>=2,'ordini: visibili nel pannello');
 t.click(t.$('tmClose'));t.click(t.$('mall'));await t.adv(300);t.click(t.$('tExp'));await t.adv(300);
 ok(t.errs.length===0,'ordini: «Unisci tutto» non genera errori');}
{const t=await boot({...base,introSeen:1,dl:{d:-1,m:[],last:dn2,st:2,dbl:1,lr:null},ev:{wk:Math.floor((dn2+3)/7),el:0,p:500,tot:0,b:0,ok:1,x:0,m:null,got:0,cl:[],sp:{}}},{});
 t.click(t.$('tExp'));await t.adv(300);const n0=t.qa('#grid .c.f').length;
 t.click(t.q('#tmB [data-a=eb][data-i="5"]'));await t.adv(300);ok(t.qa('#grid .c.f').length===n0+1,'evento: il campione è UN mostro in più (non riempie il laboratorio)');
 const b0=t.S().boost;t.click(t.q('#tmB [data-a=eb][data-i="0"]'));await t.adv(300);ok(t.S().boost-1.8e12<2*3600e3,'evento: ⚡ dà 60 minuti, non 1000 ore');
 ok(t.errs.length===0,'evento: nessun errore JS '+t.errs.slice(0,2));}
{const t=await boot({...base,introSeen:0,tut:3,dl:{d:-1,m:[],last:dn2-1,st:6,dbl:1,lr:null,sh:0}},{});await t.adv(1200);
 ok(t.$('intro').classList.contains('on'),'introduzione ai timer mostrata una volta');
 t.click(t.q('#introOk'));ok(!t.$('intro').classList.contains('on'),'«Ho capito!» la chiude');
 t.click(t.$('tDaily'));t.click(t.q('#dBody [data-a=cd]'));await t.adv(1200);ok(t.S().dl.cl.includes(7),'serie 7: il traguardo arriva da solo');
 ok(!/undefined/.test(t.$('dBody').textContent),'calendario serie senza testi mancanti');}
{const t=await boot({...base,introSeen:1,dl:{d:-1,m:[],last:-1,st:0,dbl:1,lr:null},exp:{run:[{q:1,st:1.8e12-1000,et:1.8e12+5e6,v:1000}]}},{});await t.adv(6000);
 ok(t.S().exp.run[0].et===1.8e12+5e6,'ricaricando un salvataggio con spedizione in corso l\'orario resta quello salvato');}

// --- Evocazione oscura con timer in corso: spedizioni e uova restano, gli ordini aperti si rinnovano, il resto della partita si azzera
{const t=await boot({...base,introSeen:1,dl:{d:-1,m:[],last:dn2,st:2,dbl:1,lr:null},exp:{run:[{q:1,st:1.8e12-1000,et:1.8e12+9e6,v:500}]},inc:{r:[{k:1,t:1,st:1.8e12-1000,b:100}],h:2,nes:1,k:[0,1,2,3]},ord:{list:[],n:7,best:6,tier:3,miss:0,hot:0}},{});
 await t.adv(1500);const oldOrd=t.S().ord.list.map(o=>o.et).join();
 t.click(t.$('n2'));t.click(t.$('pr'));await t.adv(6000);const S2=t.S();
 ok(S2.exp.run.length===1&&S2.exp.run[0].et===1.8e12+9e6,'prestigio: la spedizione in corso resta con il suo orario');
 ok(S2.inc.r.length===1&&S2.inc.h===2,'prestigio: il nido e le schiuse restano');
 ok(S2.ord.n===7&&S2.ord.tier===3&&S2.ord.list.map(o=>o.et).join()!==oldOrd,'prestigio: grado e conteggio ordini restano, quelli aperti si rinnovano');
 ok(S2.ach.pr===(base.ach.pr||0)+1&&t.errs.length===0,'prestigio con timer: eseguito senza errori');}

// --- sblocchi a obiettivi: un giocatore nuovo parte con il solo laboratorio, le funzioni si aprono con i traguardi
{const t=await boot({g:[3,3,...z(18)],tut:3,disc:[1,1,1,...z(23)],ul:['v2','ups'],introSeen:0},{});await t.adv(1200);
 ok(t.$('n1').classList.contains('lk')&&!t.$('n2').classList.contains('lk'),'giocatore nuovo: Battaglia chiusa (lucchetto), Potenziamenti aperti');
 ok(t.$('tools').style.display==='none'&&t.$('adr').style.display==='none'&&!t.$('intro').classList.contains('on'),'all\'inizio niente icone in alto, niente boost, niente introduzione ai timer');
 ok(t.$('goal').classList.contains('ul')&&/level 4|livello 4/.test(t.$('goalT').textContent),'la barra obiettivo indica il prossimo sblocco ('+t.$('goalT').textContent+')');
 ok(t.$('u2').style.display==='none'&&t.$('uLk').style.display!=='none','potenziamenti: quelli chiusi non si vedono, il prossimo mostra il requisito');
 const st0=t.S().st;await t.adv(3000);ok(t.S().st===st0,'prima dello sblocco la battaglia è ferma');
 t.click(t.$('n1'));ok(!t.$('batV').classList.contains('on')&&/Dark summoning|Evocazione oscura/.test(t.$('toast').textContent),'toccare Battaglia chiusa non la apre e dice cosa serve ('+t.$('toast').textContent+')');
 const cells=t.qa('#grid .c');t.click(cells[0]);t.click(cells[1]);await t.adv(1500);
 ok(t.S().ul.includes('ads')&&!t.S().ul.includes('bat')&&t.$('ulp').classList.contains('on')&&t.$('adr').style.display!=='none','mostro di livello 4 → boost con video sbloccati con la finestra «Nuova funzione»');
 t.click(t.q('#ulp [data-a=go]'));ok(!t.$('ulp').classList.contains('on'),'«Andiamo!» chiude la finestra');
 t.click(t.$('n2'));t.click(t.$('pr'));ok(t.S().ach.pr===0,'senza abbastanza monete niente Evocazione oscura');
 ok(t.errs.length===0,'sblocchi: nessun errore JS '+t.errs.slice(0,2));}
{const t=await boot({g:[5,5,...z(18)],tut:3,disc:[1,1,1,1,1,1,1,0,...z(18)],ul:['v2','ups','ads','day','col','exp','pr','u2','u3','u4'],run:9e5,introSeen:1},{});await t.adv(600);
 ok(t.$('n1').classList.contains('lk'),'prima dell\'Evocazione oscura la Battaglia è chiusa');
 t.click(t.$('n2'));t.click(t.$('pr'));await t.adv(1500);
 ok(t.S().ach.pr===1&&t.S().ul.includes('bat')&&t.S().ul.includes('por')&&t.$('ulp').classList.contains('on'),'prima Evocazione oscura → Battaglia (e Portale) sbloccati');
 t.click(t.q('#ulp [data-a=go]'));ok(t.$('batV').classList.contains('on'),'«Andiamo!» apre la Battaglia');
 ok(t.errs.length===0,'sblocchi dopo l\'Evocazione: nessun errore JS '+t.errs.slice(0,2));}
{const t=await boot({...base,ul:['col']},{});await t.adv(600);
 ok(['ups','bat','day','col','exp','por','tow','u5'].every(k=>t.S().ul.includes(k))&&!t.$('ulp').classList.contains('on'),'salvataggio di prima con Evocazione oscura: tutto resta aperto, senza finestre');}

// --- salvataggi rovinati: l'avvio non deve rompersi (prima la pagina restava bianca per sempre)
for(const [nome,sv] of [['sq null',{sq:null}],['campi null',{c:null,up:null,pk:'x',tr:5,dl:{m:null,w:7}}],['celle sporche',{g:['a',null,99,-3,2,1]}],['numeri NaN',{st:'9',bs:null,essT:'много',tut:77}]]){
 const t=await boot(sv);
 ok(!!t.$('coins').textContent&&t.errs.length===0&&t.$('coins').textContent.indexOf('NaN')<0,'salvataggio rovinato ('+nome+'): il gioco parte');
}
process.exit(fails?1:0);

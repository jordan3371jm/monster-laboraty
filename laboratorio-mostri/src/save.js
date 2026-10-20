import {sleep} from './core/dom.js';
import {R,S,def,setS} from './core/state.js';
import {K,MAXT,N,NR,WS} from './data/config.js';
import {PK,PKR,UP,mult} from './game/economy.js';
import {EXCL,GR,NID,NEST,ORD_Q,SH,nidCatchUp,nidDur,nidSync,ordFill,ordTick,timersTick} from './game/timers.js';
import {dayCheck} from './ui/missions.js';

// ---- Difesa da salvataggi rovinati (null, testo al posto di numeri, tipi sbagliati): senza questo un solo campo storto bloccava l'avvio per sempre ----
const obj=x=>x&&typeof x==='object'&&!Array.isArray(x)?x:{};
const arr=x=>Array.isArray(x)?[]:x; // array in un campo che deve essere oggetto → si riparte da vuoto
const fin=(x,dv,lo=0,hi=Infinity)=>typeof x==='number'&&isFinite(x)?Math.min(hi,Math.max(lo,x)):dv;
const ints=a=>a.filter(x=>Number.isInteger(x));
const lv=x=>Number.isInteger(x)&&x>0&&x<=MAXT?x:0;   // livello mostro valido (0 = cella vuota)
// mult() non deve mai restituire NaN/0: un numero sporco nel salvataggio fermerebbe tutti i guadagni
function safeMult(){let m=1;try{m=mult()}catch(e){m=1}if(!isFinite(m)||m<=0)m=1;return m}
function sanitize(d){
 for(const k of ['c','sp','ess','run','boost','fm','ls','pt','essT','lt'])S[k]=fin(S[k],d[k]);
 S.c=Math.max(0,S.c);S.ess=Math.max(0,S.ess);safeMult(); // prima di tutto: se il tasso è rotto niente funziona
 S.st=Math.floor(fin(S.st,1,1));S.introSeen=S.introSeen?1:0;S.bs=Math.floor(fin(S.bs,1,1));S.tut=Math.floor(fin(S.tut,0,0,3));S.wd=fin(S.wd,1,1,2)|0||1;
 S.sfxOn=S.sfxOn?1:0;S.musOn=S.musOn?1:0;if(!['auto','it','en'].includes(S.lp))S.lp='auto';
 S.g=S.g.map(t=>Number.isInteger(t)&&t>0&&t<=MAXT?t:0);
 S.sq=Array.isArray(S.sq)?S.sq.filter(t=>Number.isInteger(t)&&t>0&&t<=MAXT).slice(0,4):[];
 for(const u of UP)S.up[u.k]=Math.floor(fin(S.up[u.k],0,0,u.max));
 const pk=obj(S.pk);S.pk={...d.pk};for(const p of PK)S.pk[p.k]=Math.floor(fin(pk[p.k],0,0,p.max));for(const p of PKR)S.pk[p.k]=Math.floor(fin(pk[p.k],0,0,p.max));
 S.ach={...d.ach,...obj(S.ach)};for(const k in S.ach)S.ach[k]=fin(S.ach[k],0);
 S.tr=obj(S.tr);S.an=obj(S.an);
 const dl=S.dl;if(!Array.isArray(dl.m))dl.m=[];dl.m=dl.m.filter(m=>m&&typeof m==='object');dl.w=dl.w&&typeof dl.w==='object'?dl.w:null;
 for(const k of ['d','last','wk'])dl[k]=fin(dl[k],-1,-1e9,1e15);
 dl.st=Math.floor(fin(dl.st,0,0,1e6));
 for(const k of ['sh','cl2','mon','hp'])dl[k]=Math.floor(fin(dl[k],k==='sh'?1:0,0,1e6));
 dl.dbl=dl.dbl?1:0;dl.lr=dl.lr&&typeof dl.lr==='object'?{c:fin(dl.lr.c,0),e:fin(dl.lr.e,0)}:null;
 dl.cl=ints(arr(dl.cl)).filter(x=>GR.some(g=>g.d===x)).slice(0,GR.length); // traguardi già riscossi della serie lunga
 // ---- Spedizioni: solo voci ben formate; gli orari vengono portati a "adesso" se il salvataggio è vecchio o spostato nel futuro ----
 const now=Date.now(),exp=obj(S.exp);S.exp={run:Array.isArray(exp.run)?exp.run.slice(0,3):[]};
 S.exp.run=S.exp.run.filter(e=>e&&typeof e==='object').map(e=>{const q=Math.floor(fin(e.q,0,0,2)),dur=e.et-e.st;
  return{q,st:now,et:now+(dur>0&&dur<=8*3600e3?dur:3600e3*(1+q*3)),v:Math.floor(fin(e.v,0))}});
 // ---- Nidi delle uova: progresso mai oltre il tempo richiesto, mai negativo ----
 const inc=obj(S.inc);S.inc={r:Array.isArray(inc.r)?inc.r.slice(0,NEST):[],h:Math.floor(fin(inc.h,0)),nes:Math.floor(fin(inc.nes,1,1,NEST)),
  k:ints(arr(inc.k)).filter(k=>NID[k]).slice(0,NID.length)};
 if(!S.inc.k.length)S.inc.k=NID.map((_,i)=>i);
 S.inc.r=S.inc.r.filter(n=>n&&typeof n==='object'&&NID[n.t]).map(n=>({k:Math.floor(fin(n.k,0,0,NID.length-1)),t:n.t,st:fin(n.st,now),p:Math.min(fin(n.p,0),nidDur(n))}));
 // ---- Ordini di unione ----
 const ord=obj(S.ord);S.ord={list:Array.isArray(ord.list)?ord.list.slice(0,ORD_Q):[],n:Math.floor(fin(ord.n,0)),best:Math.floor(fin(ord.best,0,0,MAXT)),
  tier:Math.floor(fin(ord.tier,1,1,4)),miss:Math.floor(fin(ord.miss,0,0,4)),hot:fin(ord.hot,0)};
 S.ord.list=S.ord.list.filter(o=>o&&typeof o==='object').map(o=>{const st=fin(o.st,now),et=fin(o.et,st+300e3);
  return{t:Math.floor(fin(o.t,1,1,MAXT)),st,et:Math.max(st+10e3,Math.min(st+10*60e3,et)),c:[0,1,2].includes(o.c)?o.c:0}});
 // ---- Evento settimanale ----
 const ev=obj(S.ev);const sp=obj(ev.sp);const spo={};for(const key in sp)if(Array.isArray(sp[key]))spo[key]=ints(sp[key]).filter(i=>i>=0&&i<SH.length).slice(0,SH.length);
 S.ev={wk:Math.floor(fin(ev.wk,-1,-1,1e9)),el:Math.floor(fin(ev.el,0,0,2)),p:Math.floor(fin(ev.p,0)),b:Math.floor(fin(ev.b,0)),ok:Math.floor(fin(ev.ok,0)),
  x:Math.min(.6,fin(ev.x,0,0,.6)),got:ev.got?1:0,m:ev.m&&typeof ev.m==='object'?{wk:Math.floor(fin(ev.m.wk,-1,-1,1e9)),t:lv(ev.m.t)||WS+1,lv:Math.floor(fin(ev.m.lv,4,1,MAXT)),left:Math.floor(fin(ev.m.left,0,0,7*86400e3))}:null,
  cl:ints(arr(ev.cl)).filter(i=>i>=0&&i<SH.length),sp:spo};}
// ---- Salvataggio ----
function save(force){if(!R.loaded)return; // prima di load() S è lo stato vuoto: non deve sovrascrivere il salvataggio vero
 S.ls=Date.now();const j=JSON.stringify(S);try{localStorage.setItem(K,j)}catch(e){}
 if(R.inited&&(force||S.ls-R.lastB>10000)&&window.bridge.storage&&window.bridge.storage.set){R.lastB=S.ls;try{Promise.resolve(window.bridge.storage.set(K,j)).catch(()=>{})}catch(e){}}}
async function load(){const c=[];
 try{const r=localStorage.getItem(K);if(r)c.push(JSON.parse(r))}catch(e){}
 if(R.inited&&window.bridge.storage&&window.bridge.storage.get){try{const r=await Promise.race([window.bridge.storage.get(K),sleep(3000).then(()=>null)]);if(r)c.push(typeof r==='string'?JSON.parse(r):r)}catch(e){}}
 const v=c.filter(x=>x&&Array.isArray(x.g)&&x.g.length>=1&&x.g.length<=N).sort((a,b)=>(b.ls||0)-(a.ls||0))[0];
 if(v){const d=def();setS({...d,...v,up:{...d.up,...obj(v.up)},dl:{...d.dl,...obj(v.dl)}});sanitize(d);
  if(v.sfxOn===undefined){S.sfxOn=S.musOn=v.snd===0?0:1}delete S.snd; // il vecchio interruttore unico diventa effetti + musica
  while(S.g.length<N)S.g.push(0); // i vecchi salvataggi avevano meno celle
  if(v.bs===undefined)S.bs=Math.max(1,v.st||1);S.bs=Math.max(S.bs,S.st||1);S.st=Math.max(1,Math.min(S.st,S.bs));
  if(v.tut===undefined&&(v.sp>0||v.run>0||v.st>1))S.tut=3;
  // migrazione dai salvataggi precedenti (13 mostri, Essenze non spendibili)
  if(v.essT===undefined)S.essT=S.ess||0;
  if(v.lt===undefined)S.lt=Math.max(S.run||0,S.c||0);
  S.tr={...d.tr,...obj(v.tr)};S.pk={...d.pk,...obj(v.pk)};S.ach={...d.ach,...obj(v.ach)};S.an={...d.an,...obj(v.an)};if(!Array.isArray(S.an.d))S.an.d=[];if(!S.an.f||typeof S.an.f!=='object')S.an.f={};
  if(!Array.isArray(S.disc))S.disc=d.disc;S.disc=S.disc.map(x=>x?1:0);while(S.disc.length<EXCL)S.disc.push(0);S.disc.length=EXCL; // 26 mostri + il Drago del Tempo
  if(!Array.isArray(S.col))S.col=d.col;S.col=S.col.map(x=>x?1:0);while(S.col.length<NR)S.col.push(0);S.col.length=NR;
  if(Math.max(0,...S.g)>WS||S.disc[WS])S.wd=2;
  R.trC=Object.keys(S.tr).length;
  const mx=Math.max(0,...S.g);for(let t=1;t<=mx;t++)S.disc[t-1]=1;sanitize(d);
  // I timer riprendono da dove erano: le uova avanzano col tempo trascorso (col tetto offline), gli ordini tornano in coda, le spedizioni pronte restano da riscuotere
  dayCheck();timersTick();nidSync();nidCatchUp();ordTick();ordFill()}
  else{dayCheck();timersTick();ordFill()}}
export {save,load,sanitize};

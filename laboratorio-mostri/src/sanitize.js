import {S} from './core/state.js';
import {E,MAXT} from './data/config.js';
import {PK,PKR,UP,mult} from './game/economy.js';
import {EVM,GR,NID,NEST,ORD_DUR,ORD_Q,ORD_WAIT,SH} from './game/timers.js';
import {sanCh} from './game/meta.js';
import {UB} from './game/combat.js';

// ---- Difesa da salvataggi rovinati (null, testo al posto di numeri, tipi sbagliati): senza questo un solo campo storto bloccava l'avvio per sempre ----
const num0=x=>typeof x==='number'&&isFinite(x)?x:Date.now();
const obj=x=>x&&typeof x==='object'&&!Array.isArray(x)?x:{};
const arr=x=>Array.isArray(x)?x:[]; // qualunque cosa non sia un array → array vuoto (era invertita: svuotava gli array validi e lasciava passare i valori sbagliati)
const fin=(x,dv,lo=0,hi=Infinity)=>typeof x==='number'&&isFinite(x)?Math.min(hi,Math.max(lo,x)):dv;
const ints=a=>a.filter(x=>Number.isInteger(x));
const lv=x=>Number.isInteger(x)&&x>0&&x<=MAXT?x:0;   // livello mostro valido (0 = cella vuota)
// mult() non deve mai restituire NaN/0: un numero sporco nel salvataggio fermerebbe tutti i guadagni
function safeMult(){let m=1;try{m=mult()}catch(e){m=1}if(!isFinite(m)||m<=0)m=1;return m}
// timer della festa (spedizione / uovo): partenza mai nel futuro, fine al massimo 8 ore dopo adesso
function evT(x,q){if(!x||typeof x!=='object')return null;const now=Date.now(),st=Math.min(fin(x.st,now),now),et=fin(x.et,NaN);if(!isFinite(et))return null;
 const o={st,et:Math.min(et,now+8*3600e3)};if(q)o.q=Math.floor(fin(x.q,0,0,2));return o}
function sanitize(d){
 for(const k of ['c','sp','ess','run','boost','fm','ls','pt','essT','lt','ulAt','prTip'])S[k]=fin(S[k],d[k]);
 S.c=Math.max(0,S.c);S.ess=Math.max(0,S.ess);S.boost=Math.min(S.boost,Date.now()+24*3600e3); // il boost non supera 24 ore (ripara anche i salvataggi creati con il vecchio errore delle 1000 ore)
 safeMult(); // prima di tutto: se il tasso è rotto niente funziona
 S.st=Math.floor(fin(S.st,1,1));S.introSeen=S.introSeen?1:0;S.bs=Math.floor(fin(S.bs,1,1));S.tut=Math.floor(fin(S.tut,0,0,3));S.wd=fin(S.wd,1,1,3)|0||1;
 S.sfxOn=S.sfxOn?1:0;S.musOn=S.musOn?1:0;if(!['auto','en','it','es','fr','ru','zh'].includes(S.lp))S.lp='auto';
 S.g=S.g.map(t=>Number.isInteger(t)&&t>0&&t<=MAXT?t:0);
 const gv=Array.isArray(S.gv)?S.gv:[];S.gv=S.g.map((t,i)=>t&&gv[i]?1:0); // varianti dorate: solo sulle celle occupate
 S.ch=sanCh(S.ch);S.ul=Array.isArray(S.ul)?S.ul.filter(k=>typeof k==='string').slice(0,50):[];
 S.am=S.am?1:0;S.ae=S.ae?1:0;{const q=obj(S.sad);S.sad={d:Math.floor(fin(q.d,-1)),n:Math.floor(fin(q.n,0,0,99))}}S.amAd=Math.min(fin(S.amAd,0),Date.now()+3*3e5);S.mga=Math.floor(fin(S.mga,0,0,1e6));{const q=obj(S.iap);S.iap={x2:q.x2?1:0,na:q.na?1:0,st:q.st?1:0,os:Math.min(fin(q.os,0,0),Date.now()),got:arr(q.got).filter(k=>typeof k==='string').slice(-60)}}
 S.sq=Array.isArray(S.sq)?S.sq.filter(t=>Number.isInteger(t)&&t>0&&t<=MAXT).slice(0,4):[];
 for(const u of UP)S.up[u.k]=Math.floor(fin(S.up[u.k],0,0,u.max));
 {const q=obj(S.ub);S.ub={};for(const u of UB)S.ub[u.k]=Math.floor(fin(q[u.k],0,0,u.max))}
 const pk=obj(S.pk);S.pk={...d.pk};for(const p of PK)S.pk[p.k]=Math.floor(fin(pk[p.k],0,0,p.max));for(const p of PKR)S.pk[p.k]=Math.floor(fin(pk[p.k],0,0,p.max));
 S.ach={...d.ach,...obj(S.ach)};for(const k in S.ach)S.ach[k]=fin(S.ach[k],0);
 S.tr=obj(S.tr);S.an=obj(S.an);
 const dl=S.dl;if(!Array.isArray(dl.m))dl.m=[];dl.m=dl.m.filter(m=>m&&typeof m==='object');dl.w=dl.w&&typeof dl.w==='object'?dl.w:null;
 for(const k of['wl','ml'])dl[k]=Array.isArray(dl[k])?dl[k].filter(m=>m&&typeof m==='object'&&typeof m.t==='string'):[];
 // missioni: obiettivo almeno 1, progresso tra 0 e l'obiettivo (un numero sporco dava barre NaN e missioni mai completabili)
 for(const k of['m','wl','ml'])dl[k]=dl[k].filter(m=>typeof m.t==='string').slice(0,8).map(m=>{const n=Math.floor(fin(m.n,1,1,1e9));return{...m,n,p:Math.floor(fin(m.p,0,0,n)),c:m.c?1:0}});
 for(const k of ['d','last','wk','mo'])dl[k]=fin(dl[k],-1,-1e9,1e15);
 dl.st=Math.floor(fin(dl.st,0,0,1e6));
 for(const k of ['sh','cl2','mon','hp'])dl[k]=Math.floor(fin(dl[k],k==='sh'?1:0,0,1e6));
 dl.dbl=dl.dbl?1:0;dl.lr=dl.lr&&typeof dl.lr==='object'?{c:fin(dl.lr.c,0),e:fin(dl.lr.e,0)}:null;
 dl.cl=ints(arr(dl.cl)).filter(x=>GR.some(g=>g.d===x)).slice(0,GR.length); // traguardi già riscossi della serie lunga
 // ---- Spedizioni: si conservano gli orari salvati (altrimenti ogni ricarica farebbe ripartire il timer). Solo valori impossibili vengono corretti ----
 const now=Date.now(),exp=obj(S.exp);S.exp={run:Array.isArray(exp.run)?exp.run.slice(0,3):[]};
 S.exp.run=S.exp.run.filter(e=>e&&typeof e==='object').map(e=>{const q=Math.floor(fin(e.q,0,0,2)),std=Math.min(fin(e.st,now,0,now),now),dur=fin(e.et,NaN)-std,ok=dur>0&&dur<=8*3600e3;
  const et=ok?std+dur:now+3600e3*(1+q*3);                                  // durata illeggibile: riparte dalla durata standard del tipo
  return{q,st:std,et:Math.min(et,now+8*3600e3),v:Math.floor(fin(e.v,0)),c:Number.isInteger(e.c)&&e.c>=0&&e.c<64?e.c:-1}});
 // ---- Nidi delle uova: tipo valido, orario di partenza mai nel futuro, un solo uovo per tipo ----
 const inc=obj(S.inc);S.inc={r:Array.isArray(inc.r)?inc.r.slice(0,NEST):[],h:Math.floor(fin(inc.h,0)),nes:Math.floor(fin(inc.nes,1,1,NEST)),
  k:ints(arr(inc.k)).filter(k=>NID[k]).slice(0,NID.length)};
 if(!S.inc.k.length)S.inc.k=NID.map((_,i)=>i);
 const seen=new Set();
 S.inc.r=S.inc.r.filter(n=>n&&typeof n==='object'&&Number.isInteger(n.t)&&NID[n.t]).map(n=>({k:Math.floor(fin(n.k,n.t,0,NID.length-1)),t:n.t,st:Math.min(fin(n.st,now),now),b:Math.floor(fin(n.b,0))}))
  .filter(n=>!seen.has(n.k)&&seen.add(n.k));
 // ---- Ordini di unione: si tengono tutti i campi (orari, icona, stato), con limiti sensati ----
 const ord=obj(S.ord);S.ord={list:Array.isArray(ord.list)?ord.list.slice(0,ORD_Q+2):[],n:Math.floor(fin(ord.n,0)),best:Math.floor(fin(ord.best,0,0,MAXT)),
  tier:Math.floor(fin(ord.tier,1,1,4)),miss:Math.floor(fin(ord.miss,0,0,4)),hot:fin(ord.hot,0,0,now+10*60e3),nx:arr(ord.nx).filter(x=>typeof x==='number'&&isFinite(x)).map(x=>Math.min(x,now+ORD_WAIT)).sort((a,b)=>a-b).slice(0,ORD_Q)};
 S.ord.list=S.ord.list.filter(o=>o&&typeof o==='object').map(o=>{const t=Math.floor(fin(o.t,2,2,MAXT)),st=Math.min(fin(o.st,now),now);
  return{t,k:o.k==='at'?'at':'ex',ic:E[t-1],st,et:Math.min(fin(o.et,st+ORD_DUR),now+ORD_DUR),c:[0,1,2].includes(o.c)?o.c:0,d:o.d?1:0,ct:Math.min(fin(o.ct,now),now)}});
 // ---- Evento settimanale ----
 const ev=obj(S.ev);const sp=obj(ev.sp);const spo={};for(const key in sp)if(Array.isArray(sp[key]))spo[key]=ints(sp[key]).filter(i=>i>=0&&i<SH.length).slice(0,SH.length);
 S.ev={wk:Math.floor(fin(ev.wk,-1,-1,1e9)),el:Math.floor(fin(ev.el,0,0,2)),p:Math.floor(fin(ev.p,0)),tot:Math.floor(fin(ev.tot,0)),b:Math.floor(fin(ev.b,0)),ok:Math.floor(fin(ev.ok,0)),
  x:Math.min(.6,fin(ev.x,0,0,.6)),got:ev.got?1:0,m:ev.m&&typeof ev.m==='object'?{wk:Math.floor(fin(ev.m.wk,-1,-1,1e9)),t:lv(ev.m.t)||2,lv:Math.floor(fin(ev.m.lv,5,1,MAXT)),left:Math.floor(fin(ev.m.left,0,0,30*86400e3))}:null,
  cl:ints(arr(ev.cl)).filter((i,j,a)=>i>=0&&i<EVM.length&&a.indexOf(i)===j),mc:Math.floor(fin(ev.mc,0,0,99)),sp:spo,fx:evT(ev.fx,1),fn:evT(ev.fn,0)}}
export {sanitize,obj,fin,num0};

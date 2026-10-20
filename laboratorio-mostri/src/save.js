import {sleep} from './core/dom.js';
import {R,S,def,setS} from './core/state.js';
import {K,MAXT,N,NR,WS} from './data/config.js';
import {PK,PKR,UP} from './game/economy.js';

// ---- Difesa da salvataggi rovinati (null, testo al posto di numeri, tipi sbagliati): senza questo un solo campo storto bloccava l'avvio per sempre ----
const obj=x=>x&&typeof x==='object'&&!Array.isArray(x)?x:{};
const fin=(x,dv,lo=0,hi=Infinity)=>typeof x==='number'&&isFinite(x)?Math.min(hi,Math.max(lo,x)):dv;
function sanitize(d){
 for(const k of ['c','sp','ess','run','boost','fm','ls','pt','essT','lt'])S[k]=fin(S[k],d[k]);
 S.st=Math.floor(fin(S.st,1,1));S.bs=Math.floor(fin(S.bs,1,1));S.tut=Math.floor(fin(S.tut,0,0,3));S.wd=fin(S.wd,1,1,2)|0||1;
 S.sfxOn=S.sfxOn?1:0;S.musOn=S.musOn?1:0;if(!['auto','it','en'].includes(S.lp))S.lp='auto';
 S.g=S.g.map(t=>Number.isInteger(t)&&t>0&&t<=MAXT?t:0);
 S.sq=Array.isArray(S.sq)?S.sq.filter(t=>Number.isInteger(t)&&t>0&&t<=MAXT).slice(0,4):[];
 for(const u of UP)S.up[u.k]=Math.floor(fin(S.up[u.k],0,0,u.max));
 const pk=obj(S.pk);S.pk={...d.pk};for(const p of PK)S.pk[p.k]=Math.floor(fin(pk[p.k],0,0,p.max));for(const p of PKR)S.pk[p.k]=Math.floor(fin(pk[p.k],0,0,p.max));
 S.ach={...d.ach,...obj(S.ach)};for(const k in S.ach)S.ach[k]=fin(S.ach[k],0);
 S.tr=obj(S.tr);S.an=obj(S.an);
 const dl=S.dl;if(!Array.isArray(dl.m))dl.m=[];dl.m=dl.m.filter(m=>m&&typeof m==='object');dl.w=dl.w&&typeof dl.w==='object'?dl.w:null;
 for(const k of ['d','last','st','dbl','wk','sh'])dl[k]=fin(dl[k],d.dl[k],-1);dl.lr=dl.lr===null?null:fin(dl.lr,null)}
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
  if(!Array.isArray(S.disc))S.disc=d.disc;S.disc=S.disc.map(x=>x?1:0);while(S.disc.length<MAXT)S.disc.push(0);S.disc.length=MAXT;
  if(!Array.isArray(S.col))S.col=d.col;S.col=S.col.map(x=>x?1:0);while(S.col.length<NR)S.col.push(0);S.col.length=NR;
  if(Math.max(0,...S.g)>WS||S.disc[WS])S.wd=2;
  R.trC=Object.keys(S.tr).length;
  const mx=Math.max(0,...S.g);for(let t=1;t<=mx;t++)S.disc[t-1]=1;sanitize(d)}}
export {save,load};

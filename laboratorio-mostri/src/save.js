import {sleep} from './core/dom.js';
import {R,S,def,setS} from './core/state.js';
import {K,MAXT,N,NR,WS} from './data/config.js';
import {timersTick} from './game/timers.js';
import {obj,num0,sanitize} from './sanitize.js';
import {dayCheck} from './ui/missions.js';

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
  if(!Array.isArray(S.disc))S.disc=d.disc;S.disc=S.disc.map(x=>x?1:0);while(S.disc.length<MAXT)S.disc.push(0);S.disc.length=MAXT; // solo i 26 mostri: il Drago del Tempo vive in S.dl.mon
  if(!Array.isArray(S.col))S.col=d.col;S.col=S.col.map(x=>x?1:0);while(S.col.length<NR)S.col.push(0);S.col.length=NR;
  if(Math.max(0,...S.g)>WS||S.disc[WS])S.wd=2;
  R.trC=Object.keys(S.tr).length;
  const mx=Math.max(0,...S.g);for(let t=1;t<=mx;t++)S.disc[t-1]=1;sanitize(d);
  // Spedizioni e uova hanno un orario di fine: a gioco chiuso restano pronte da riscuotere. Il campione dell'evento scorre dall'ultimo salvataggio (col tetto offline); gli ordini scaduti si chiudono.
  R.lastO=Math.min(num0(S.ls),Date.now());dayCheck();timersTick()}
  else{R.lastO=Date.now();dayCheck();timersTick()}}
export {save,load,sanitize};

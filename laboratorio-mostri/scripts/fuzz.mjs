// Fuzzer dell'interfaccia (jsdom, orologio virtuale): clicca a caso su tutto, avanza e salta il tempo, e controlla errori e valori impossibili. Richiede prima `npm run build`.
// Uso: node scripts/fuzz.mjs [passi=1500] [semi=6]
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

const STEPS=+process.argv[2]||1500,SEEDS=+process.argv[3]||6;
const now0=1.8e12,dn=Math.floor((now0-new Date().getTimezoneOffset()*60000)/864e5);
const mid={c:5e5,g:[8,8,7,6,6,5,4,3,3,2,2,1,1,0,0,0,0,0,0,0],sp:30,up:{l:3,d:2,o:1,a:2},ess:6,essT:6,run:3e6,st:12,bs:12,tut:3,introSeen:1,disc:Array(26).fill(0).map((_,i)=>i<8?1:0),lt:2e7,
 dl:{d:-1,m:[],last:dn-1,st:6,dbl:1,lr:null,wk:-1,w:null,sh:1},pk:{s:1,a:1,o:0,g:1,b:1,i:1,w:1}};
const late={...mid,c:1e20,g:[26,25,24,23,22,21,20,19,18,17,16,15,14,13,12,11,10,9,8,7,6,5,4,3],st:70,bs:70,wd:2,ess:300,essT:300,run:1e22,lt:1e25,up:{l:30,d:10,o:7,a:6,c:8},disc:Array(26).fill(1),
 pk:{s:6,a:5,o:5,g:8,b:4,x:40,t:40,h:40,e:30,v:10,i:8,w:20},dl:{d:-1,m:[],last:dn-2,st:29,dbl:1,lr:null,wk:-1,w:null,sh:1,cl:[7,14],hp:1}};
const SAVES=[null,mid,late,{...mid,tut:0},{...mid},{...late,c:50}];
const NUM=['c','sp','ess','run','boost','st','bs','fm','ls','pt','essT','lt','wd'];
const bad=m=>{console.log('✗ '+m);fails++};
function rng(a){return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function check(t,tag){
 if(t.errs.length)bad(tag+': errori JS: '+t.errs.slice(0,2).join(' | ').slice(0,300));
 const txt=t.w.document.body.textContent;const m=txt.match(/NaN|undefined|Infinity|\[object/);if(m)bad(tag+': testo anomalo «'+m[0]+'» vicino a: '+txt.slice(Math.max(0,txt.search(m[0])-40),txt.search(m[0])+40).replace(/\s+/g,' '));
 let s;try{s=t.S()}catch(e){return}if(!s)return;
 for(const k of NUM)if(typeof s[k]!=='number'||!isFinite(s[k]))bad(tag+': campo '+k+' non valido ('+s[k]+')');
 if(s.c<0)bad(tag+': monete negative '+s.c);if(s.ess<0)bad(tag+': Essenze negative '+s.ess);
 if(!Array.isArray(s.g)||s.g.some(x=>!Number.isInteger(x)||x<0||x>26))bad(tag+': griglia non valida');
 if(!Array.isArray(s.disc)||s.disc.length!==26)bad(tag+': disc non lungo 26 ('+(s.disc&&s.disc.length)+')');
 if(s.exp.run.length>1)bad(tag+': più spedizioni insieme');if(s.inc.r.length>3||new Set(s.inc.r.map(n=>n.k)).size!==s.inc.r.length)bad(tag+': nidi incoerenti');
 if(s.ord.list.length>4)bad(tag+': troppi ordini');if(s.ess>s.essT)bad(tag+': Essenze spendibili > ottenute ('+s.ess+'>'+s.essT+')');
 for(const o of s.ord.list)if(!Number.isFinite(o.et)||o.t<2||o.t>26)bad(tag+': ordine non valido '+JSON.stringify(o));
 for(const e of s.exp.run)if(!Number.isFinite(e.et)||e.et-e.st>8*3600e3+1)bad(tag+': spedizione non valida');
 if(s.boost-t.w.Date.now()>26*3600e3)bad(tag+': boost oltre 26 ore');
}
const S0=+process.argv[4]||0;
for(let sd=S0;sd<S0+SEEDS;sd++){
 const R=rng(sd*7919+13),lang=sd%2?'en':'it',t=await boot(SAVES[sd%SAVES.length],{lang});let last='';
 for(let i=0;i<STEPS;i++){
  const r=R();
  if(r<.6){const els=t.qa('button, #grid .c, #goal, #cele').filter(e=>!e.disabled&&!e.closest('[style*="display: none"]'));
   if(els.length){const e=els[R()*els.length|0];last=(e.id||e.dataset.a||e.className)+'';try{e.dispatchEvent(new t.w.MouseEvent('click',{bubbles:true}))}catch(x){t.errs.push('CLICK '+last+': '+x.message)}}}
  else if(r<.66){for(const id of ['arena','ev'])if(R()<.5)t.$(id).dispatchEvent(new t.w.MouseEvent('pointerdown',{bubbles:true}))}
  else if(r<.86)await t.adv(R()*3000);
  else if(r<.96)await t.adv(R()*90000);
  else{t.jump(R()*10*3600e3);await t.adv(600)}
  if(i%30===0)check(t,'seme '+sd+' passo '+i+' (ultimo clic: '+last+')');
  if(fails>=6)break}
 check(t,'seme '+sd+' fine');console.log('seme '+sd+' ('+lang+') completato: '+STEPS+' passi, errori finora '+fails)}
console.log(fails?'FUZZ: '+fails+' problemi':'FUZZ: nessun problema');process.exit(fails?1:0);

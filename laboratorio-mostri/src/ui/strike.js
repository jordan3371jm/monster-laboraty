import {sfx} from '../audio.js';
import {tr} from '../data/text.js';

// ---- Minigioco «Colpo al momento giusto» (Torre e Prove dei Campioni) ----
// Una lancetta corre avanti e indietro su una barra: si tocca per fermarla. Al centro (oro) il colpo vale ×2,5, poi ×1,6 (verde),
// ×1 (giallo) e ×0,4 ai bordi (rosso). Tre colpi: si vince se la somma dei moltiplicatori arriva a need (= SG_N / forza relativa).
// Il nemico mostra la vita che scende a ogni colpo; se finisce prima del terzo colpo si vince subito.
const SG_N=3,ZONES=[{d:5,m:2.5,k:'perf'},{d:15,m:1.6,k:'great'},{d:30,m:1,k:'good'},{d:51,m:.4,k:'miss'}];
let G=null;
const zoneOf=pos=>ZONES.find(z=>Math.abs(pos-50)<=z.d)||ZONES[3];
// Difficoltà da mostrare prima dello scontro: quanto deve valere in media ogni colpo
const difOf=need=>{const a=need/SG_N;return a<=.7?0:a<=1.2?1:a<=1.8?2:a<=2.5?3:4};
function stopG(){if(G&&G.raf)cancelAnimationFrame(G.raf);G=null}
// el: contenitore; need: somma da raggiungere; emo: nemico (HTML); speed: % di barra al secondo; onEnd({m,pf,win})
function strike(el,{need,emo,speed,onEnd}){stopG();el._h=null; // setT non deve credere che il contenuto sia ancora quello di prima
 el.innerHTML='<div class="sg"><div class="sgE">'+emo+'</div><div class="bar sgH"><i style="width:100%"></i></div><div class="sgC">'+tr('sg_hit').replace('{n}',1)+'</div>'
  +'<div class="sgBar"><b class="sgN"></b></div><div class="sgF"></div><button class="b g sgB">'+tr('sg_go')+'</button><small class="d">'+tr('sg_tip')+'</small></div>';
 const g=G={el,need,n:0,m:0,pf:0,pos:Math.random()*100,dir:1,speed,last:performance.now(),onEnd,lock:false,raf:0},nd=el.querySelector('.sgN');
 const loop=t=>{if(G!==g)return;const dt=Math.min(.05,(t-g.last)/1000);g.last=t;
  if(!g.lock){g.pos+=g.dir*g.speed*dt;if(g.pos>100){g.pos=200-g.pos;g.dir=-1}if(g.pos<0){g.pos=-g.pos;g.dir=1}nd.style.left=g.pos+'%'}
  g.raf=requestAnimationFrame(loop)};
 g.raf=requestAnimationFrame(loop);
 const hit=e=>{if(e)e.stopPropagation();if(G!==g||g.lock)return;const z=zoneOf(g.pos);g.n++;g.m+=z.m;if(z.k==='perf')g.pf++;g.lock=true;
  const left=Math.max(0,1-g.m/g.need),sg=el.querySelector('.sg');
  el.querySelector('.sgH i').style.width=left*100+'%';
  const f=el.querySelector('.sgF');f.className='sgF '+z.k;f.textContent=tr('sg_'+z.k)+' ×'+z.m;
  const en=el.querySelector('.sgE');en.classList.remove('hit');void en.offsetWidth;en.classList.add('hit');
  if(z.k==='perf')sg.classList.add('flash');sfx(z.k==='miss'?'err':z.k==='perf'?'new':'tap');
  const done=left<=0||g.n>=SG_N;
  setTimeout(()=>{if(G!==g)return;sg.classList.remove('flash');
   if(done){const r={m:g.m,pf:g.pf,win:g.m>=g.need};stopG();g.onEnd(r);return}
   g.lock=false;g.speed*=1.12;el.querySelector('.sgC').textContent=tr('sg_hit').replace('{n}',g.n+1)},done?650:450)};
 el.querySelector('.sgB').onclick=hit;el.querySelector('.sgBar').onclick=hit}
export {SG_N,strike,stopG,difOf};

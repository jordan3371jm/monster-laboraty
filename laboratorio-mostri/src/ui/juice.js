import {$} from '../core/dom.js';
import {S} from '../core/state.js';
import {E} from '../data/config.js';
import {elOf,squad} from '../game/combat.js';

// ---- Effetti grafici: sfondo animato, scia delle fusioni, onde d'urto, proiettili in battaglia, monete che volano al contatore ----
// Solo estetica: nessuna logica di gioco passa di qui. Con «riduci animazioni» quasi tutto viene saltato.
const calm=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const app=$('app');

// Sfondo: bolle che salgono nel laboratorio (mondo 1), stelle che brillano nello spazio (mondo 2), braci che salgono nel vulcano (mondo 3)
// (jsdom dei test non ha il canvas: lo salto per non sporcare il log)
const cv=$('bgfx'),cx=cv&&cv.getContext&&!/jsdom/i.test(navigator.userAgent)?cv.getContext('2d'):null;
let W=0,H=0,dpr=1,P=[],lastW=0;
function size(){if(!cx)return;dpr=Math.min(1.5,window.devicePixelRatio||1);W=app.clientWidth;H=app.clientHeight;cv.width=W*dpr;cv.height=H*dpr;cx.setTransform(dpr,0,0,dpr,0,0)}
// Bolle e braci disegnate una volta sola per colore (sprite) e poi solo copiate: niente gradienti nuovi a ogni fotogramma
const SPR={};
function sprite(h,ember){const k=h+(ember?'e':'');if(SPR[k])return SPR[k];const c=document.createElement('canvas'),r=32;c.width=c.height=r*2;const g=c.getContext('2d');
 const gr=ember?g.createRadialGradient(r,r,0,r,r,r):g.createRadialGradient(r*.65,r*.65,r*.1,r,r,r);
 if(ember){gr.addColorStop(0,'hsla('+h+',100%,75%,.95)');gr.addColorStop(.35,'hsla('+h+',100%,55%,.5)');gr.addColorStop(1,'hsla('+h+',100%,50%,0)')}
 else{gr.addColorStop(0,'hsla('+h+',90%,80%,.55)');gr.addColorStop(.7,'hsla('+h+',80%,55%,.12)');gr.addColorStop(1,'hsla('+h+',80%,60%,.35)')}
 g.fillStyle=gr;g.beginPath();g.arc(r,r,r,0,6.283);g.fill();return SPR[k]=c}
function seed(w){P=[];const n=w===2?60:34;for(let i=0;i<n;i++)P.push(part(w,true))}
function part(w,any){return w===2?{x:Math.random()*W,y:Math.random()*H,r:Math.random()*1.6+.3,ph:Math.random()*6.28,sp:Math.random()*1.5+.5,h:Math.random()<.3?280:200}
 :w===3?{x:Math.random()*W,y:any?Math.random()*H:H+20,r:Math.random()*3+1.5,v:Math.random()*30+20,ph:Math.random()*6.28,h:[12,28,40][Math.random()*3|0]}
 :{x:Math.random()*W,y:any?Math.random()*H:H+20,r:Math.random()*7+2,v:Math.random()*18+8,ph:Math.random()*6.28,h:[275,130,25][Math.random()*3|0]}}
let t0=0,dirty=true;
function frame(t){requestAnimationFrame(frame);if(!cx||document.hidden||t-t0<33)return; // ~30 fps bastano per lo sfondo
 const dt=Math.min(.1,(t-t0)/1000);t0=t;if(dirty){dirty=false;size()} // misure solo dopo un ridimensionamento (leggere clientWidth a ogni fotogramma forzava il layout)
 const w=Math.min(3,S.wd||1);if(w!==lastW){lastW=w;seed(w)}
 cx.clearRect(0,0,W,H);
 for(const p of P){
  if(w===2){p.ph+=dt*p.sp;const a=.35+.65*Math.abs(Math.sin(p.ph));cx.fillStyle='hsla('+p.h+',90%,85%,'+a+')';cx.beginPath();cx.arc(p.x,p.y,p.r,0,6.283);cx.fill()}
  else{p.y-=p.v*dt;p.ph+=dt*(w===3?2:1);const x=p.x+Math.sin(p.ph)*(w===3?10:6);
   if(p.y<-20)Object.assign(p,part(w,false));
   const r=w===3?p.r*(2.2+.6*Math.sin(p.ph*3)):p.r;cx.drawImage(sprite(p.h,w===3),x-r,p.y-r,r*2,r*2)}}
 if(w===2&&Math.random()<dt*.25)shoot1()}
let star=null;
function shoot1(){if(star)return;const s=document.createElement('i');s.className='comet';s.style.left=(Math.random()*70+10)+'%';s.style.top=(Math.random()*30)+'%';app.appendChild(s);star=s;setTimeout(()=>{s.remove();star=null},1300)}
if(cx&&typeof requestAnimationFrame==='function'){size();if(!calm())requestAnimationFrame(frame);addEventListener('resize',()=>{dirty=true});if(typeof ResizeObserver==='function')new ResizeObserver(()=>{dirty=true}).observe(app)}

// Centro di un elemento in coordinate di #app
function ctr(el){const a=app.getBoundingClientRect(),r=el.getBoundingClientRect();return{x:r.left-a.left+r.width/2,y:r.top-a.top+r.height/2,w:r.width}}
function tmp(cls,html,x,y,ms){const e=document.createElement('div');e.className=cls;if(html)e.innerHTML=html;e.style.left=x+'px';e.style.top=y+'px';app.appendChild(e);setTimeout(()=>e.remove(),ms);return e}

// Fusione: il mostro di partenza vola sulla cella di arrivo, poi onda d'urto e scritta del livello
function mergeFly(from,to,t){if(calm())return;const a=ctr(from),b=ctr(to);
 const g=tmp('fly','<i>'+E[t-2]+'</i>',a.x,a.y,420);g.style.fontSize=getComputedStyle(from).fontSize;
 g.style.setProperty('--dx',(b.x-a.x)+'px');g.style.setProperty('--dy',(b.y-a.y)+'px')}
function shock(el,t,big){if(calm())return;const c=ctr(el);const s=tmp('shock','',c.x,c.y,650);s.style.setProperty('--h',el.style.getPropertyValue('--h'));s.style.width=s.style.height=c.w+'px';
 if(t>1)tmp('lvup','LV '+t,c.x,c.y-c.w*.3,900);
 if(big){app.classList.remove('quake');void app.offsetWidth;app.classList.add('quake');setTimeout(()=>app.classList.remove('quake'),420)}}

// Scritta che sale da una cella (combo, fusione perfetta)
function label(el,txt,cls){if(calm())return;const c=ctr(el),m=Math.min(110,app.clientWidth/2); // resta dentro lo schermo anche sulle celle di bordo
 tmp('lvup '+cls,txt,Math.max(m,Math.min(app.clientWidth-m,c.x)),c.y+c.w*(cls==='cmb'?.15:-.75),1100)}

// Battaglia: un membro della squadra salta e lancia un globo del suo elemento verso il nemico
const ORB=['#ff7a2a','#3fb8ff','#6cdc3a'];
function attack(){if(calm())return;const sq=squad(),sp=$('team').querySelectorAll('span');if(!sq.length||!sp.length)return;
 const k=Math.random()*Math.min(sq.length,sp.length)|0,m=sp[k],en=$('en').firstChild;if(!en)return;
 m.classList.remove('atk');void m.offsetWidth;m.classList.add('atk');
 const a=ctr(m),b=ctr(en),o=tmp('orb','',a.x,a.y-a.w*.4,520);o.style.setProperty('--c',ORB[elOf(sq[k])]||ORB[0]);
 o.style.setProperty('--dx',(b.x-a.x+(Math.random()*30-15))+'px');o.style.setProperty('--dy',(b.y-a.y+a.w*.4)+'px')}

// Monete che volano dal punto indicato fino al contatore in alto
function coinFly(el,n){const c=$('coins');if(!c||!el)return;const bump=()=>{c.classList.remove('bump');void c.offsetWidth;c.classList.add('bump')};
 if(calm())return bump();const a=ctr(el),b=ctr(c),k=Math.min(10,n||6);
 for(let i=0;i<k;i++){const x=a.x+(Math.random()*80-40),y=a.y+(Math.random()*50-25),f=tmp('cfly','🪙',x,y,900);
  f.style.setProperty('--dx',(b.x-b.w*.35-x)+'px');f.style.setProperty('--dy',(b.y-y)+'px');f.style.animationDelay=(i*45)+'ms'}
 setTimeout(bump,700)}
export {mergeFly,shock,label,attack,coinFly};

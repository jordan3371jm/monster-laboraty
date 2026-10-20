import {R,S} from './core/state.js';
import {save} from './save.js';

// ---- Audio (WebAudio, nessun file esterno) ----
const AU={c:null,m:null,sg:null,mu:null,nb:null,plat:true,ad:false,next:0,step:0};
const audible=()=>!!(S.sfxOn||S.musOn)&&AU.plat&&!AU.ad&&!R.PZ&&!document.hidden;
function actx(){if(AU.c)return AU.c;const C=window.AudioContext||window.webkitAudioContext;if(!C)return null;
 try{const c=AU.c=new C();AU.m=c.createGain();AU.sg=c.createGain();AU.mu=c.createGain();AU.sg.gain.value=.6;AU.mu.gain.value=.1;
  AU.sg.connect(AU.m);AU.mu.connect(AU.m);AU.m.connect(c.destination);
  const b=c.createBuffer(1,c.sampleRate*.3|0,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;AU.nb=b;
  setInterval(sched,200);return c}catch(e){AU.c=null;return null}}
function aSync(){const c=AU.c;if(!c)return;
 try{audible()?c.resume&&c.resume():c.suspend&&c.suspend()}catch(e){}}
function tone(f,d,ty,v,f2,t0,out){const c=AU.c;if(!c||!audible())return;const t=c.currentTime+(t0||0),o=c.createOscillator(),g=c.createGain();
 o.type=ty||'sine';o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);
 g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v||.3,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+d);
 o.connect(g);g.connect(out||AU.sg);o.start(t);o.stop(t+d+.05)}
function noise(d,v,fc,t0){const c=AU.c;if(!c||!audible())return;const t=c.currentTime+(t0||0),s=c.createBufferSource(),f=c.createBiquadFilter(),g=c.createGain();
 s.buffer=AU.nb;f.type='lowpass';f.frequency.value=fc||1500;g.gain.setValueAtTime(v||.2,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);
 s.connect(f);f.connect(g);g.connect(AU.sg);s.start(t);s.stop(t+d+.02)}
function sfx(n,x){if(!audible()||!AU.c||!S.sfxOn)return;x=x||1;
 if(n==='tap')tone(520,.07,'triangle',.25);
 else if(n==='move')tone(330,.09,'triangle',.25,440);
 else if(n==='spawn'){tone(300,.18,'sine',.35,760);noise(.06,.12,2500)}
 else if(n==='merge'){const f=196*Math.pow(2,Math.min(x,14)*2/12);tone(f,.16,'triangle',.35);tone(f*1.5,.22,'sine',.3,0,.07);if(x>=7)tone(f*2,.3,'sine',.2,0,.14)}
 else if(n==='mall'){for(let k=0;k<Math.min(x,6);k++)tone(300+k*80,.12,'triangle',.28,0,k*.06)}
 else if(n==='new'){tone(660,.12,'sine',.3);tone(880,.12,'sine',.3,0,.09);tone(1320,.28,'sine',.3,0,.18)}
 else if(n==='hit'){noise(.07,.18,900);tone(140,.08,'square',.1,70)}
 else if(n==='ab'){tone(220,.4,'sawtooth',.2,880);noise(.25,.2,1800)}
 else if(n==='win'){[523,659,784,1047].forEach((f,k)=>tone(f,.18,'triangle',.3,0,k*.09))}
 else if(n==='lose'){tone(330,.35,'sawtooth',.18,110)}
 else if(n==='boss'){tone(70,.7,'sawtooth',.3,40);noise(.5,.25,300)}
 else if(n==='slam'){tone(90,.25,'square',.22,45);noise(.18,.3,400)}
 else if(n==='claim'){tone(988,.1,'square',.16);tone(1319,.3,'square',.16,0,.09)}
 else if(n==='err')tone(160,.12,'square',.14)}
const SC=[220,261.63,293.66,329.63,392,440],PAT=[0,2,4,2,3,2,1,2,0,3,5,3,4,3,2,1],BS=[110,110,87.31,98];
function sched(){const c=AU.c;if(!c||!audible()||!S.musOn||c.state!=='running')return;if(AU.next<c.currentTime)AU.next=c.currentTime+.05;
 while(AU.next<c.currentTime+.6){const s=AU.step++,t=AU.next-c.currentTime;
  if(s%8!==7)tone(SC[PAT[s%16]],.55,'triangle',.5,0,t,AU.mu);
  if(s%4===0)tone(BS[(s>>2)%4],1.1,'sine',.7,0,t,AU.mu);AU.next+=.3}}
function toggleAudio(k){S[k]=S[k]?0:1;actx();aSync();if(k==='sfxOn'&&S.sfxOn)sfx('tap');save()}
export {AU,actx,aSync,sfx,toggleAudio};

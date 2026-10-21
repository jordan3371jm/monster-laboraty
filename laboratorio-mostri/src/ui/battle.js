import {sfx} from '../audio.js';
import {$} from '../core/dom.js';
import {S} from '../core/state.js';
import {fmt,hueOf} from '../core/util.js';
import {E} from '../data/config.js';
import {tr,trv} from '../data/text.js';
import {AUTO_T,EL,RETREAT,SK,SLAM_D,SLAM_T,SLAM_W,SQN,advM,eAtk,eEl,eEmo,eHp,elOf,isBoss,skOn,squad,stageReward,tAtk,tHp,trait} from '../game/combat.js';
import {earn} from '../game/economy.js';
import {save} from '../save.js';
import {burst,fx,setT,toast} from './common.js';
import {track} from '../analytics.js';
import {ui} from './hud.js';
import {prog} from './missions.js';
import {chest} from './rewards.js';
import {attack,coinFly} from './juice.js';

const F={eh:0,th:0,wait:0,st:0,dm:0,stun:0,sl:0,wn:false,dd:false,lose:0,cd:[0,0,0],rd:[0,0,0]};
['arena','en','team'].forEach(id=>$(id).addEventListener('animationend',e=>{if(['shake','enter','slam','hurt'].includes(e.animationName))e.currentTarget.classList.remove(e.animationName)}));
const en0=$('en');
const onB=()=>$('batV').classList.contains('on');
function startFight(){F.st=S.st;F.eh=eHp(S.st);F.th=tHp();F.wait=0;F.dm=0;F.stun=0;F.sl=0;F.wn=false;F.dd=false;
 $('en').classList.remove('die');fx($('en'),'enter');if(isBoss(S.st)){fx($('arena'),'shake');if(onB())sfx('boss')}}
function hitFx(d,sp){if(!onB())return;const e=document.createElement('div');e.className='dm'+(sp?' sp':'');e.textContent=sp?sp:'-'+fmt(d);e.style.left=(35+Math.random()*30)+'%';e.style.top='32%';$('arena').appendChild(e);setTimeout(()=>e.remove(),950);const n=$('en');n.classList.remove('hit');void n.offsetWidth;n.classList.add('hit')}
function cast(i,pw){const a=tAtk(),h=tHp();prog('ability',1);S.ach.ab++;F.cd[i]=SK[i].cd*(1-.08*S.pk.a);F.rd[i]=0;
 if(i===0){const d=a*5*pw;F.eh-=d;hitFx(d,'🔥 '+tr('sk0')+' -'+fmt(d))}
 else if(i===1){const c=h*.35*pw;F.th=Math.min(h,F.th+c);hitFx(0,'💧 '+tr('sk1')+' +'+fmt(c))}
 else{F.stun=Math.max(F.stun,3.5*pw);hitFx(0,'🌿 '+tr('sk2')+' 💫')}
 if(onB()){fx($('arena'),'shake');sfx('ab')}}
function fight(dt){
 if(F.wait>0){F.wait-=dt;if(F.wait<=0)startFight();return}
 if(F.st!==S.st)startFight();
 const a=tAtk(),h=tHp();if(a<=0)return;
 if(F.th>h)F.th=h;
 const s=S.st,tt=trait(s),mx=eHp(s),m=tt==='armor'?.7:1;
 const d=a*dt*m;F.eh-=d;F.dm+=d;
 if(F.stun>0)F.stun-=dt;
 else{F.th-=eAtk(s)*(tt==='boss'&&F.eh<mx*.5?1.3:1)*dt;if(tt==='heal')F.eh=Math.min(mx,F.eh+mx*.025*dt)}
 // Colpo a terra del boss: avviso SLAM_W secondi prima; chi tocca l'arena lo schiva (e stordisce il boss 2s), altrimenti la squadra perde SLAM_D della vita
 if(tt==='boss'){F.sl+=dt;
  if(!F.wn&&F.sl>=SLAM_T-SLAM_W){F.wn=true;F.dd=false;if(onB()){hitFx(0,'⚠️ '+tr('slamW'));sfx('boss')}}
  if(F.sl>=SLAM_T){F.sl=0;F.wn=false;fx($('en'),'slam');fx($('arena'),'shake');
   if(F.dd){F.stun=Math.max(F.stun,2);if(onB()){hitFx(0,'💨 '+tr('dodge'));sfx('claim')}}
   else{if(F.stun<=0)F.th-=h*SLAM_D;if(onB())sfx('slam')}
   F.dd=false}}
 for(let i=0;i<3;i++){if(!skOn(i)){F.rd[i]=0;continue}
  if(F.cd[i]>0)F.cd[i]-=dt;
  else if(i===1&&F.th>h*.8)F.rd[i]=0; // la cura automatica parte solo se la squadra è ferita
  else if((F.rd[i]+=dt)>=AUTO_T)cast(i,.6)}
 if(F.dm>=a*.9){hitFx(F.dm);if(onB()){sfx('hit');attack()}F.dm=0}
 if(F.eh<=0){const rw=stageReward(s);earn(rw);S.ach.wn++;toast(trv('win')+'🪙 +'+fmt(rw));sfx('win');prog('win',1);if(onB()){burst($('arena'),isBoss(s)?['🪙','✨','⭐']:['✨'],isBoss(s)?16:5);$('en').classList.add('die');coinFly($('en'),isBoss(s)?10:4)}if(S.ach.wn===1)track('first_win');if([5,10,20,30,40].includes(s))track('stage_'+s);prog('winEl',1,eEl(s));const first=s>=S.bs&&!S.fm;F.lose=0;if(!S.fm){S.st++;if(S.st>S.bs)S.bs=S.st}save();F.wait=1;if(isBoss(s)&&first)chest()}
 else if(F.th<=0){toast(trv('lose'));sfx('lose');if(onB())fx($('team'),'hurt');F.wait=2.5;
  if(++F.lose>=RETREAT&&S.st>1){F.lose=0;S.st--;toast(tr('retreat'),1)}}} // dopo RETREAT sconfitte di fila si torna al livello prima, poi si risale da soli
function drawB(){const s=S.st,b=isBoss(s),tt=trait(s);$('stg').textContent='⚔️ '+tr('stage')+' '+s+(S.bs>s?' · 🏁'+S.bs:'');
 if(!onB())return;
 en0.classList.toggle('warn',F.wn&&b);
 setT('fmB',S.fm?tr('fmOn'):tr('fmOff'));$('fmB').classList.toggle('g',!!S.fm);$('stPrev').disabled=s<=1;$('stNext').disabled=s>=S.bs;
 setT('en','<i>'+eEmo(s)+'</i>');const en=$('en');en.classList.toggle('big',b);
 en.classList.toggle('enraged',b&&F.eh<eHp(s)*.5);['fast','armor','heal'].forEach(c=>en.classList.toggle(c,tt===c));
 $('arena').classList.toggle('bossA',b);
 $('tag').textContent=(b?'👑 '+tr('boss')+(F.eh<eHp(s)*.5?' · '+tr('enr'):''):(tt!=='n'?tr('t_'+tt):''))+' '+EL[eEl(s)];
 $('enm').textContent=fmt(Math.max(F.eh,0))+' / '+fmt(eHp(s))+(F.stun>0?'  💫':'');
 const ew=Math.max(0,F.eh/eHp(s)*100)+'%';$('ehb').style.width=ew;$('eh').style.setProperty('--g',ew); // --g: barra «fantasma» che segue in ritardo
 const h=tHp(),tw=h?Math.max(0,Math.min(1,F.th/h))*100+'%':'0%';$('thb').style.width=tw;$('th').style.setProperty('--g',tw);
 let lk=0;for(let i=0;i<3;i++){const on=skOn(i),k=$('sk'+i),rdy=on&&F.cd[i]<=0&&F.wait<=0;if(!on)lk=1;
  k.classList.toggle('lock',!on);k.classList.toggle('rdy',rdy);k.firstChild.style.width=on?(F.cd[i]>0?(1-F.cd[i]/(SK[i].cd*(1-.08*S.pk.a)))*100:100)+'%':'0%';
  setT('skl'+i,on?SK[i].ic+' '+tr('sk'+i)+(F.cd[i]>0?' · '+Math.ceil(F.cd[i])+'s':''):'🔒 '+EL[i])}
 setT('skh',lk?tr('skLock'):tr('skHint'));
 setT('team',(squad().map(t=>{const m=advM(elOf(t),eEl(s));return'<span class="'+(m>1?'up':m<1?'dn':'')+'">'+E[t-1]+'<sup>'+EL[elOf(t)]+'</sup></span>'}).join('')||tr('noteam'))+'<small class="ed">✏️ '+(S.sq.length?tr('sqMan'):tr('sqAutoL'))+'</small>');
 $('ts').textContent='⚔️ '+tr('atk')+' '+fmt(tAtk(),1)+'/s  ·  ❤️ '+fmt(Math.max(F.th,0))+' / '+fmt(h)+'  ·  +'+Math.round(3*(S.bs-1))+'% '+tr('stb')}
function renderSq(){const sq=squad(),cnt={};S.g.filter(Boolean).forEach(t=>cnt[t]=(cnt[t]||0)+1);sq.forEach(t=>cnt[t]--);
 const chip=(t,a,x,sm)=>'<button class="sqc f" data-a="'+a+'" '+x+' style="--h:'+hueOf(t)+'"><i>'+E[t-1]+'</i><small>'+sm+'</small></button>';
 let h='<div class="cs">'+tr('sqD')+'</div><div class="sqs">'+Array.from({length:SQN},(_,i)=>sq[i]?chip(sq[i],'rm','data-i="'+i+'"',EL[elOf(sq[i])]):'<div class="sqc"></div>').join('')+'</div>'
 +'<div class="dh">'+tr('sqAv')+'</div><div class="sqs av">'+Object.keys(cnt).map(Number).filter(t=>cnt[t]>0).sort((a,b)=>b-a).map(t=>chip(t,'add','data-t="'+t+'"',EL[elOf(t)]+' ×'+cnt[t])).join('')+'</div>'
 +'<button class="b'+(S.sq.length?'':' g')+'" data-a="auto">'+tr('sqAuto')+'</button>';
 setT('sqB',h)}
$('team').onclick=()=>{renderSq();$('sqp').classList.add('on')};$('sqClose').onclick=()=>$('sqp').classList.remove('on');
$('sqB').onclick=e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,sq=squad();
 if(a==='auto')S.sq=[];
 else if(a==='rm'){sq.splice(+b.dataset.i,1);S.sq=sq}
 else if(a==='add'&&sq.length<SQN)S.sq=[...sq,+b.dataset.t];
 sfx('tap');save();renderSq();ui()};
$('arena').addEventListener('pointerdown',()=>{if(F.wn&&!F.dd){F.dd=true;if(onB())sfx('tap')}});
const goStage=d=>{S.st=Math.max(1,Math.min(S.bs,S.st+d));if(d<0)S.fm=1;F.lose=0;sfx('tap');save();drawB()};
$('stPrev').onclick=()=>goStage(-1);$('stNext').onclick=()=>goStage(1);
$('fmB').onclick=()=>{S.fm=S.fm?0:1;sfx('tap');save();drawB()};
for(let i=0;i<3;i++)$('sk'+i).onclick=()=>{if(!skOn(i)||F.cd[i]>0||F.wait>0)return;cast(i,1);drawB()};
export {F,onB,startFight,fight,drawB,renderSq};

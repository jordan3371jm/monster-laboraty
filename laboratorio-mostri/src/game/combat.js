import {W} from '../data/config.js';
import {S} from '../core/state.js';
import {earn,essMult,PK_B,PKR_T,PKR_H} from './economy.js';

const atkT=t=>2*Math.pow(1.9,t-1),hpT=t=>12*Math.pow(2,t-1);
// Squadra: fino a 4 mostri del laboratorio (auto = i più forti), con bonus formazione.
// Elementi: (livello-1)%3 → 0 🔥, 1 💧, 2 🌿. 🔥>🌿>💧>🔥
// Elemento di ogni mostro (0 🔥, 1 💧, 2 🌿): ora è una proprietà del mostro, non del suo livello. Le prime abilità (liv. 4, 5, 6) coprono i tre elementi.
const ELM=[2,1,2,0,1,2,0,2,1,1,2,0,0, 1,2,0,1,0,2,1,0,1,1,2,0,2, 0,2,0,1,0,2,0,0,1,0,2,0,1];
const SQN=4,SQB=1.3,EL=['🔥','💧','🌿'],elOf=t=>ELM[t-1]??(t-1)%3,eEl=s=>isBoss(s)?(s/5)%3:(s-1)%3;
const advM=(a,d)=>(a-d+3)%3===1?1.5:(d-a+3)%3===1?.7:1;
function squad(){const pool=S.g.filter(Boolean).sort((x,y)=>y-x),out=[];
 if(S.sq.length){for(const t of S.sq){const i=pool.indexOf(t);if(i>=0&&out.length<SQN){out.push(t);pool.splice(i,1)}}}
 if(!out.length)return pool.slice(0,SQN);
 return out}
// Ganci per la progressione permanente (game/meta.js li registra: campioni, equipaggiamento, album, invasione). Da soli valgono ×1.
const CK={el:()=>1,atk:()=>1,hp:()=>1,ehp:()=>1},setCK=(k,f)=>{CK[k]=f};
// Bonus elemento (come le fazioni): 3 mostri dello stesso elemento in squadra +20% attacco, 4 → +40%
function faction(q=squad()){if(q.length<3)return 1;const n=[0,0,0];q.forEach(t=>n[elOf(t)]++);const m=Math.max(...n);return m>=4?1.4:m>=3?1.2:1}
// ---- Potenziamenti della battaglia (monete, scheda «Battaglia» dei Potenziamenti; si azzerano con l'Evocazione oscura come quelli del laboratorio) ----
// a attacco +10%, h vita +10%, g monete dei livelli +10%, c probabilità di critico +0,1% (da 5% a 100%), d danno critico +1% (da 150% a 10000%),
// r rigenerazione: vita al secondo in numeri (3 al livello 1, +11% a livello). Cura al massimo REG_CAP della vita al secondo, così la squadra non diventa immortale.
const UB=[{k:'a',ic:'⚔️',max:300,cost:l=>Math.floor(80*Math.pow(1.27,l))},{k:'h',ic:'❤️',max:300,cost:l=>Math.floor(80*Math.pow(1.27,l))},
 {k:'g',ic:'💰',max:150,cost:l=>Math.floor(120*Math.pow(1.29,l))},{k:'c',ic:'🎯',max:950,cost:l=>Math.floor(500*Math.pow(1.035,l))},
 {k:'d',ic:'💥',max:9850,cost:l=>Math.floor(800*Math.pow(1.004,l))},{k:'r',ic:'💚',max:2000,cost:l=>Math.floor(1000*Math.pow(1.125,l))}];
const ub=k=>(S.ub&&S.ub[k])||0,REG_CAP=.1;
const critC=()=>Math.min(1,.05+.001*ub('c')),critD=()=>1.5+.01*ub('d'),critAvg=()=>1+critC()*(critD()-1);
const regen=()=>{const l=ub('r');return l?3*Math.pow(1.11,l-1):0},regenFor=hp=>Math.min(regen(),REG_CAP*hp);
const tAtk=(st=S.st)=>{const q=squad();return q.reduce((s,t)=>s+atkT(t)*advM(elOf(t),eEl(st))*CK.el(elOf(t)),0)*SQB*faction(q)*CK.atk()*essMult(S.essT)*(1+PKR_T*(S.pk.t||0))*(1+.1*ub('a'))*(Date.now()<S.boost?2:1)};
// La vita sale con la radice del bonus Essenze: l'attacco da solo non basterebbe contro nemici che colpiscono sempre più forte
const tHp=()=>squad().reduce((s,t)=>s+hpT(t),0)*SQB*CK.hp()*Math.sqrt(essMult(S.essT))*(1+PKR_H*(S.pk.h||0))*(1+.1*ub('h'));
const isBoss=s=>s%5===0;
const TR=['fast','armor','n','heal','armor','fast','heal','n'];
const trait=s=>isBoss(s)?'boss':s<3?'n':TR[(s-3)%8];
const eHp=s=>Math.floor(30*Math.pow(1.45,s-1)*(isBoss(s)?4:1)*({fast:.75,heal:1.1}[trait(s)]||1)*CK.ehp());
const eAtk=s=>2*Math.pow(1.4,s-1)*(isBoss(s)?1.5:1)*(trait(s)==='fast'?1.5:1);
const eEmo=s=>{const w=W[Math.min(W.length,S.wd)-1];return isBoss(s)?w.bm[(s/5-1)%w.bm.length]:w.en[trait(s)][s%3]};
// Abilità attive: una per elemento, sbloccata da un mostro di quell'elemento (liv. 4+) in squadra
const SK=[{cd:10,ic:'🔥'},{cd:16,ic:'💧'},{cd:14,ic:'🌿'}],SKMIN=4,AUTO_T=6;
const skOn=i=>squad().some(t=>elOf(t)===i&&t>=SKMIN);
// Colpo a terra del boss: ogni SLAM_T secondi toglie SLAM_D della vita della squadra, a meno che il giocatore lo schivi toccando l'arena
const SLAM_T=5,SLAM_W=1.6,SLAM_D=.1,RETREAT=3;
// Quanti secondi servono alla squadra per battere il livello s (Infinity se perde prima). Le abilità attive non contano: stima prudente.
// È la stessa formula usata dalla simulazione e dal combattimento offline.
function fightTime(s){const a=tAtk(s)*critAvg(),hp=tHp(),tt=trait(s),mx=eHp(s),dps=a*(tt==='armor'?.7:1)-(tt==='heal'?mx*.025:0);
 if(a<=0||dps<=0)return Infinity;
 const T=mx/dps,boss=isBoss(s),dmg=eAtk(s)*(boss?1.15:1)*T+(boss?hp*SLAM_D*(T/SLAM_T):0)-regenFor(hp)*T; // la rigenerazione cura durante lo scontro
 return dmg<hp?T:Infinity}
// Combattimento mentre si è via: al 50% della velocità e con 3s di attesa tra un livello e l'altro, senza forzieri. Ritorna i livelli vinti e le monete.
const OFF_SLOW=2,OFF_WAIT=3;
function offBattle(secs){let n=0,coins=0,left=secs;const b0=S.boost;S.boost=0; // senza boost: i pochi secondi di x2 rimasti non valgono per ore di battaglia
 while(n<400){const s=S.st,T=fightTime(s);if(!isFinite(T))break;const c=(T+OFF_WAIT)*OFF_SLOW;if(c>left)break;left-=c;
  const rw=stageReward(s);earn(rw);coins+=rw;n++;S.ach.wn++;if(!S.fm){S.st++;if(S.st>S.bs)S.bs=S.st}}
 S.boost=b0;return {n,coins}}
// Premio in monete per aver battuto il livello s
const stageReward=s=>Math.floor(40*Math.pow(1.5,s-1)*(isBoss(s)?5*(1+PK_B*S.pk.b):1)*(1+.1*ub('g')));
export {UB,ub,critC,critD,critAvg,regen,regenFor,setCK,faction,SLAM_T,SLAM_W,SLAM_D,RETREAT,fightTime,offBattle,ELM,atkT,hpT,SQN,SQB,EL,elOf,eEl,advM,squad,tAtk,tHp,isBoss,TR,trait,eHp,eAtk,eEmo,SK,SKMIN,AUTO_T,skOn,stageReward};

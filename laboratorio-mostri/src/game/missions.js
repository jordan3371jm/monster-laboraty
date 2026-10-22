import {S} from '../core/state.js';
import {dayNum} from './economy.js';
import {has} from './unlocks.js';

// ---- Missioni giornaliere, settimanali e mensili (logica, senza interfaccia: la schermata è ui/missions.js) ----
// Ogni periodo ha 5 missioni scelte a caso (ma uguali per tutto il periodo: il seme è il numero del giorno/settimana/mese)
// tra quelle dei sistemi già sbloccati. Le settimanali e le mensili contengono sempre missioni «di costanza» (giocare in più
// giorni diversi, completare missioni) che non si possono finire in poche ore di gioco, anche giocando tantissimo.
// req = sistema che deve essere sbloccato (unlocks.js), mx = livello minimo di mostro (abilità: elemento al livello 4+)
const MT={merge:{},spawn:{},upg:{},event:{},hand:{},gold:{},win:{req:'bat'},winEl:{req:'bat'},ability:{req:'bat',mx:4},chest:{req:'bat'},
 ord:{req:'exp'},exp:{req:'exp'},pull:{req:'por'},pr:{req:'pr'},days:{},dmis:{},wmis:{},bonus:{req:'day'}};
// quantità: giornaliere piccole, settimanali ~40-60 volte tanto, mensili molto di più (e sempre scalate sui giorni rimasti)
const NDAY={merge:30,spawn:20,upg:3,event:3,hand:15,gold:1,win:6,winEl:3,ability:7,chest:1,ord:2,exp:1,pull:1};
const NWEEK={merge:1500,spawn:600,upg:20,event:25,hand:500,gold:8,win:120,winEl:40,ability:100,chest:8,ord:20,exp:7,pull:12,pr:3};
const NMONTH={merge:15000,spawn:6000,hand:4000,event:120,win:1500,ability:600,pr:15};
const ok=t=>{const m=MT[t];return!!m&&(!m.req||has(m.req))&&(!m.mx||Math.max(0,...S.g)>=m.mx)};
// generatore pseudo-casuale con seme: le stesse missioni per tutto il periodo anche ricaricando il gioco
const rnd=seed=>{let x=(seed*2654435761)>>>0||1;return()=>(x=(x*1664525+1013904223)>>>0)/4294967296};
const pick=(list,k,r)=>{const a=list.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a.slice(0,k)};
const mk=(t,n,x)=>({t,n:Math.max(1,Math.round(n)),p:0,c:0,...x});

// Giornaliere: sempre una di unioni + 4 a caso
function mkDaily(d){const r=rnd(d+11),pool=Object.keys(NDAY).filter(t=>t!=='merge'&&ok(t));
 const v=1+((d%3)*.25); // un po' di varietà nelle quantità da un giorno all'altro
 return[mk('merge',NDAY.merge*v),...pick(pool,4,r).map(t=>mk(t,NDAY[t]*(t==='upg'||t==='chest'||t==='exp'||t==='pull'||t==='gold'?1:v),t==='winEl'?{el:d%3}:{}))]}
// Settimanali: giocare in più giorni + missioni giornaliere completate + 3 a caso (grandi)
function mkWeekly(w,left){const r=rnd(w*7+5),f=Math.min(1,left/7),pool=Object.keys(NWEEK).filter(ok);
 return[mk('days',Math.min(5,left)),mk('dmis',15*f),...pick(pool,3,r).map(t=>mk(t,NWEEK[t]*f,t==='winEl'?{el:w%3}:{}))]}
// Mensili: costanza su tutto il mese (giorni, missioni, bonus) + 1 grande; se il mese è già iniziato si scalano sui giorni rimasti
function mkMonthly(mo,left,dim){const r=rnd(mo*31+3),f=Math.min(1,left/dim),big=pick(Object.keys(NMONTH).filter(ok),1,r)[0]||'merge';
 return[mk('days',Math.min(20,Math.ceil(20*f),left)),mk('dmis',70*f),mk('wmis',10*f),has('day')?mk('bonus',Math.min(20,Math.ceil(20*f),left)):mk(big==='merge'?'spawn':'merge',NMONTH[big==='merge'?'spawn':'merge']*f),mk(big,NMONTH[big]*f)]}

// Numeri dei periodi (ora locale): la settimana inizia il lunedì, il mese è quello del calendario
const weekNum=()=>Math.floor((dayNum()+3)/7),weekLeft=()=>7-(dayNum()+3)%7;
const monthNum=()=>{const d=new Date();return d.getFullYear()*12+d.getMonth()};
const monthInfo=()=>{const d=new Date(),dim=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();return{dim,left:dim-d.getDate()+1}};
const msLeft=k=>{const d=new Date();if(k===0)return new Date(d.getFullYear(),d.getMonth(),d.getDate()+1)-d;if(k===1)return weekLeft()*864e5-(d-new Date(d.getFullYear(),d.getMonth(),d.getDate()));return new Date(d.getFullYear(),d.getMonth()+1,1)-d};
// Rinnova le liste quando cambia il periodo. «Gioca in N giorni diversi»: ogni giorno nuovo vale +1 per tutte le liste;
// una lista appena creata (nuova settimana/mese, o salvataggio vecchio) conta subito anche il giorno di oggi.
function misCheck(prog){const d=dayNum(),dl=S.dl,fresh=[];let newDay=false;
 if(dl.d!==d){dl.d=d;dl.m=mkDaily(d);newDay=true}
 const w=weekNum();if(dl.wk!==w||!Array.isArray(dl.wl)||!dl.wl.length){dl.wk=w;dl.wl=mkWeekly(w,weekLeft());dl.w=null;fresh.push(dl.wl)}
 const mo=monthNum(),mi=monthInfo();if(dl.mo!==mo||!Array.isArray(dl.ml)||!dl.ml.length){dl.mo=mo;dl.ml=mkMonthly(mo,mi.left,mi.dim);fresh.push(dl.ml)}
 if(newDay&&prog)prog('days',1);
 else fresh.forEach(l=>l.forEach(m=>{if(m.t==='days')m.p=Math.min(m.n,m.p+1)}))}
// Ricompense: giornaliere piccole, settimanali con 🔮, mensili grandi
const REW=[{c:1,e:0,t:1,pe:25,tm:0},{c:6,e:1,t:2,pe:80,tm:5},{c:30,e:4,t:6,pe:200,tm:20}]; // tm: Tomi 📘 per i campioni
const lists=()=>[S.dl.m,S.dl.wl,S.dl.ml];
const claimable=k=>(lists()[k]||[]).filter(m=>m.p>=m.n&&!m.c).length;
export {MT,NDAY,NWEEK,NMONTH,mkDaily,mkWeekly,mkMonthly,weekNum,weekLeft,monthNum,monthInfo,msLeft,misCheck,REW,lists,claimable};

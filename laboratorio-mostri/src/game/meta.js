import {S} from '../core/state.js';
import {evoIdx,CH,ODDS,PITY_R,PITY_L,MAXSTAR,GEAR,GEARV,GEARMAX,ALB,CARDW} from '../data/champs.js';
import {dayNum,earn,rBase,setHook} from './economy.js';
import {setCK,tAtk,tHp,elOf} from './combat.js';

// ---- Progressione permanente (resta dopo l'Evocazione oscura): Campioni del Portale, equipaggiamento, Torre giornaliera,
// pass stagionale, Invasione dei boss e album di figurine. Tutto in S.ch. Niente interfaccia qui: la usano ui/meta.js e i test.
const HOUR=3600e3,LDMAX=2,FREE_CD=8*HOUR,AD_MAX=2;
const defCh=()=>({t:0,own:{},cp:{},ld:[],pr:0,pl:0,n:0,free:0,adD:-1,adN:0,gear:[],eq:{},nid:1,
 tw:{d:-1,tries:3,run:0,f:1,best:0,rec:0,buf:[],ch:null},ps:{o:-1,s:-1,xp:0,cl:[],cp:[],prem:0,dd:-1,dm:0,dw:0},man:0,iv:{wk:-1,pts:0,cl:0,b:1},cards:Array(18).fill(0),alb:[0,0]});
const C=()=>S.ch||(S.ch=defCh());   // stato nuovo o azzerato: si crea al primo uso

// ---- Campioni ----
const star=i=>C().own[i]||0;
const form=i=>CH[i].f[evoIdx(CH[i],Math.max(1,star(i)))]; // nome dell'immagine della forma attuale
const sMul=i=>1+.25*(Math.max(1,star(i))-1);                 // ★1 → ×1, ★5 → ×2
const skVal=i=>CH[i].v*sMul(i);
const busy=i=>Array.isArray(S.exp&&S.exp.run)&&S.exp.run.some(e=>e&&e.c===i);   // in spedizione: non guida la squadra
const leaders=()=>C().ld.filter(i=>star(i)>0&&!busy(i));
const sk=(k,el)=>leaders().reduce((s,i)=>s+(CH[i].sk===k&&(el===undefined||CH[i].el===el)?skVal(i):0),0);
const LEADB=[.05,.1,.18,.3,.35];                                 // forza base che un capo dà alla squadra, per rarità
const leadAtk=()=>leaders().reduce((s,i)=>s+LEADB[CH[i].r]*sMul(i),0);
const gearOf=i=>(C().eq[i]||[]).map(id=>C().gear.find(g=>g.id===id)).filter(Boolean);
const gearB=k=>leaders().reduce((s,i)=>s+gearOf(i).reduce((a,g)=>a+(GEAR[g.s].k===k?g.v/100:0),0),0);
const albB=k=>ALB.reduce((s,a,i)=>s+(C().alb[i]&&a.b===k?a.v:0),0);
// Moltiplicatori usati dal resto del gioco
const atkMul=()=>1+leadAtk()+sk('atk')+sk('all')+gearB('atk')+albB('atk');
const hpMul=()=>1+sk('hp')+sk('all')+gearB('hp');
const incMul=()=>1+sk('inc')+sk('all')+gearB('inc')+albB('inc');
const goldMul=()=>1+sk('gold'),cdMul=()=>Math.max(.5,1-sk('cd')),luckAdd=()=>sk('luck'),bossStun=()=>sk('stun'),slamMul=()=>Math.max(0,1-sk('slam')),bossMul=()=>1+sk('boss');
// Campione che accompagna una spedizione: premio più ricco secondo rarità e stelle (e la sua abilità «exp»). Mentre è via non guida la squadra.
const EXPB=[.15,.3,.5,.8,.9];
const expMulCh=i=>Number.isInteger(i)&&i>=0&&star(i)>0?1+EXPB[CH[i].r]*sMul(i)+(CH[i].sk==='exp'?skVal(i):0):1;
function setLeader(i,on){const c=C();c.man=1;if(on){if(star(i)<1||c.ld.includes(i))return false;if(c.ld.length>=LDMAX)c.ld.shift();c.ld.push(i)}else c.ld=c.ld.filter(x=>x!==i);return true}

// ---- Portale: probabilità per rarità, garanzia di un raro ogni PITY_R e di un leggendario entro PITY_L (prima quelli che non hai) ----
const POOL=CH.map((_,i)=>i).filter(i=>!CH[i].ex);
function rollRar(){const c=C();c.pr++;c.pl++;if(c.pl>=PITY_L)return 3;
 const q=Math.random();let a=0,r=0;for(;r<3;r++){a+=ODDS[r];if(q<a)break}
 return r<1&&c.pr>=PITY_R?1:r}
// Un campione in più: nuovo (★1), una copia verso la stella successiva (★n → ★n+1 servono 3n copie: 30 doppioni in tutto fino a ★5),
// oppure — già a ★5 — un po' di monete (e qualche biglietto per epici e leggendari). Il rimborso in biglietti deve restare
// ben sotto 1 per evocazione: con 1,7 di media (vecchi valori) chi aveva tutto a ★5 otteneva evocazioni infinite.
const needCp=i=>3*Math.max(1,star(i)),cps=i=>C().cp[i]||0;
function giveCh(i){const c=C(),s=star(i);
 if(s>=MAXSTAR){const back=[0,0,1,2,3][CH[i].r],co=Math.floor(rBase()*[.3,.6,1.2,2.5,3][CH[i].r]);c.t+=back;earn(co);return{i,s,back,co}}
 if(s){const cp=cps(i)+1;if(cp>=needCp(i)){c.own[i]=s+1;delete c.cp[i];return{i,s:s+1,up:1,evo:evoIdx(CH[i],s+1)>evoIdx(CH[i],s)}}c.cp[i]=cp;return{i,s,cp,need:needCp(i)}} // evo: ha cambiato forma
 c.own[i]=1;
 {if(c.ld.length<LDMAX)c.ld.push(i);
  else if(!c.man){const w=[...c.ld].sort((a,b)=>CH[a].r-CH[b].r)[0];if(CH[w].r<CH[i].r)c.ld[c.ld.indexOf(w)]=i}} // finché il giocatore non sceglie a mano, a capo vanno i più rari
 return{i,s:1,nw:1}}
function pull1(){const c=C(),r=rollRar();if(r>=1)c.pr=0;if(r>=3)c.pl=0;c.n++;
 let pool=POOL.filter(i=>CH[i].r===r);if(r===3){const nw=pool.filter(i=>!star(i));if(nw.length)pool=nw}
 return giveCh(pool[Math.random()*pool.length|0])}
function pullT(n){const c=C();if(c.t<n)return null;c.t-=n;const out=[];for(let k=0;k<n;k++)out.push(pull1());return out}
const freeLeft=()=>Math.max(0,C().free+FREE_CD-Date.now());
function pullFree(){if(freeLeft()>0)return null;C().free=Date.now();return[pull1()]}
const adLeft=()=>C().adD===dayNum()?Math.max(0,AD_MAX-C().adN):AD_MAX;
function pullAd(){if(adLeft()<1)return null;const c=C(),d=dayNum();if(c.adD!==d){c.adD=d;c.adN=0}c.adN++;return[pull1()]}
const addT=n=>{if(n>0)C().t+=n};

// ---- Equipaggiamento: 3 slot per campione, conta solo per i capi squadra ----
const gearRar=b=>{const q=Math.random()+b;return q>1.35?3:q>1.05?2:q>.6?1:0};   // b: spinta verso rarità alte (forzieri migliori, piani alti)
function addGear(r){const c=C(),g={id:c.nid++,s:Math.random()*3|0,r,v:Math.max(1,Math.round(GEARV[r]*(.8+.4*Math.random())))};c.gear.push(g);
 if(c.gear.length>GEARMAX){const eqd=new Set(Object.values(c.eq).flat()),w=c.gear.filter(x=>!eqd.has(x.id)&&x.id!==g.id).sort((a,b)=>a.r-b.r||a.v-b.v)[0];if(w)salvage(w.id)}
 for(const i of leaders()){const e=c.eq[i]=c.eq[i]||[0,0,0];if(!e[g.s]){e[g.s]=g.id;break}} // slot vuoto di un capo: si monta da solo
 return g}
const SALV=[.2,.5,1,2];
function salvage(id){const c=C(),k=c.gear.findIndex(g=>g.id===id);if(k<0)return 0;const g=c.gear[k];
 for(const i in c.eq)c.eq[i]=c.eq[i].map(x=>x===id?0:x);c.gear.splice(k,1);const v=Math.floor(rBase()*SALV[g.r]);earn(v);return v}
function equip(i,id){const c=C(),g=c.gear.find(x=>x.id===id);if(!g||star(i)<1)return false;
 for(const k in c.eq)c.eq[k]=c.eq[k].map(x=>x===id?0:x);const e=c.eq[i]=c.eq[i]||[0,0,0];e[g.s]=id;return true}
function unequip(i,s){const e=C().eq[i];if(e)e[s]=0}
// Mette a ogni capo, slot per slot, il pezzo migliore libero
function autoEquip(){const c=C(),ld=leaders();for(const i of ld)c.eq[i]=[0,0,0];
 for(const i of ld)for(let s=0;s<3;s++){const used=new Set(Object.values(c.eq).flat()),best=c.gear.filter(g=>g.s===s&&!used.has(g.id)).sort((a,b)=>b.v-a.v)[0];if(best)c.eq[i][s]=best.id}}

// ---- Album di figurine ----
function addCard(){const a=Math.random()<.5?0:1,tot=CARDW.reduce((s,w)=>s+w,0);let q=Math.random()*tot,k=0;for(;k<8;k++){q-=CARDW[k];if(q<0)break}
 C().cards[a*9+k]++;return{a,k}}
const albHave=a=>C().cards.slice(a*9,a*9+9).filter(n=>n>0).length;
const albDone=a=>albHave(a)===9;
const albDup=a=>C().cards.slice(a*9,a*9+9).reduce((s,n)=>s+Math.max(0,n-1),0);
const ALB_T=25;
function albClaim(a){const c=C();if(!albDone(a)||c.alb[a])return false;c.alb[a]=1;addT(ALB_T);return true}
// 3 doppioni dello stesso album → una carta che manca
function albTrade(a){const c=C();if(albDup(a)<3||albDone(a))return null;
 for(let n=3;n>0;){const k=c.cards.slice(a*9,a*9+9).reduce((b,x,j,arr)=>x>arr[b]?j:b,0);if(c.cards[a*9+k]<2)break;c.cards[a*9+k]--;n--}
 const miss=[...Array(9).keys()].filter(k=>!c.cards[a*9+k]),k=miss[Math.random()*miss.length|0];c.cards[a*9+k]=1;return{a,k}}

// ---- Torre giornaliera: 3 tentativi al giorno, piani sempre più duri, un potenziamento da scegliere (1 su 3) dopo ogni piano ----
// I premi si prendono solo la prima volta che un piano viene superato nella giornata: rifare i piani bassi non paga due volte.
const TW_TRIES=3,TW_T=40;
const BUFS=[{k:'a',atk:.2},{k:'h',hp:.25},{k:'b',atk:.1,hp:.1},{k:'r',atk:.4,hp:-.15},{k:'g',gold:.5}];
function twCheck(){const c=C(),d=dayNum();if(c.tw.d!==d)c.tw={d,tries:TW_TRIES,run:0,f:1,best:0,rec:c.tw.rec||0,buf:[],ch:null}}
const twStage=f=>Math.max(3,Math.round(S.bs*.6))+2*(f-1);
const twBoss=f=>f%5===0;
const twBuf=k=>C().tw.buf.reduce((s,b)=>s+((BUFS.find(x=>x.k===b)||{})[k]||0),0);
const twHp=f=>{const s=twStage(f);return 30*Math.pow(1.45,s-1)*(twBoss(f)?3:1)},twAtk=f=>{const s=twStage(f);return 2*Math.pow(1.4,s-1)*(twBoss(f)?1.4:1)};
// Esito del piano: vince se batte il nemico entro TW_T secondi senza finire la vita. r = quota di vita nemica tolta (per l'animazione).
function twSim(f){const a=tAtk(twStage(f))*(1+twBuf('atk'))*(twBoss(f)?bossMul():1),hp=tHp()*Math.max(.3,1+twBuf('hp')),mx=twHp(f),ea=twAtk(f);
 if(!(a>0))return{win:false,r:0,T:0};const T=mx/a,lim=Math.min(TW_T,hp/ea);return{win:T<=lim,r:Math.min(1,lim/T),T:Math.min(T,lim)}}
function twStart(){const c=C();twCheck();if(c.tw.run||c.tw.tries<1)return false;c.tw.tries--;Object.assign(c.tw,{run:1,f:1,buf:[],ch:null});return true}
function twFight(){const c=C(),tw=c.tw;if(!tw.run||tw.ch)return null;const f=tw.f,res=twSim(f);
 if(!res.win){tw.run=0;tw.ch=null;return{...res,f}}
 const rw={f};if(f>tw.best){tw.best=f;tw.rec=Math.max(tw.rec,f);
  rw.c=Math.floor(rBase()*.3*(1+.1*f)*(1+twBuf('gold')));earn(rw.c);rw.t=(f%3===0?1:0)+(twBoss(f)?2:0);addT(rw.t); // biglietti ogni 3 piani (+2 ai boss)
  if(f%3===0)rw.g=addGear(gearRar(Math.min(.5,f*.03)));if(f%2===0)rw.card=addCard()}
 const TWX=CH.findIndex(x=>x.ex==='tw');if(tw.rec>=20&&TWX>=0&&!star(TWX))rw.chr=giveCh(TWX); // campione speciale della Torre
 tw.f++;const pick=[...BUFS].sort(()=>Math.random()-.5).slice(0,3).map(b=>b.k);tw.ch=pick;
 return{...res,f,rw}}
function twPick(k){const tw=C().tw;if(!tw.ch||!tw.ch.includes(k))return false;tw.buf.push(k);tw.ch=null;return true}
function twQuit(){const tw=C().tw;tw.run=0;tw.ch=null}

// ---- Pass stagionale: 28 giorni, 30 livelli. I PE arrivano giocando (con un tetto giornaliero per unioni e vittorie) ----
const PS_LV=30,PS_XP=230,PS_LEN=28,PS_CAP=60;
// La stagione parte dal primo accesso di ogni giocatore (con un calendario uguale per tutti chi arriva all'ultimo giorno avrebbe una stagione di poche ore)
const psO=()=>{const p=C().ps;if(!(p.o>=0))p.o=dayNum();return p.o};
const psSeason=()=>Math.floor((dayNum()-psO())/PS_LEN),psLeft=()=>PS_LEN-(dayNum()-psO())%PS_LEN;
function psCheck(){const c=C(),s=psSeason();if(c.ps.s!==s)c.ps={o:c.ps.o,s,xp:0,cl:[],cp:[],prem:0,dd:-1,dm:0,dw:0}}
const psLv=()=>Math.min(PS_LV,Math.floor(C().ps.xp/PS_XP));
// k: 'm' unione, 'w' vittoria (con tetto PS_CAP al giorno), altrimenti punti fissi (missioni, boss, torre…)
function psAdd(n,k){psCheck();const p=C().ps,d=dayNum();if(p.dd!==d){p.dd=d;p.dm=0;p.dw=0}
 if(k==='m'||k==='w'){const key='d'+k,room=Math.max(0,PS_CAP-p[key]);n=Math.min(n,room);p[key]+=n}
 if(n>0)p.xp=Math.min(PS_LV*PS_XP,p.xp+n)}
const SEASON_CH=CH.findIndex(c=>c.ex==='ps');
const psRew=(l,prem)=>prem?(l%5===0?{g:l>=15?3:2}:{t:2}):(l===PS_LV?{ch:SEASON_CH}:l%5===0?{g:l>=20?2:1}:l%3===0?{card:1}:{t:l<10?1:2});
// Consegna un premio (pass, invasione…): biglietti, pezzo d'equipaggiamento, figurina, campione
function grant(r){const out={...r};if(r.t)addT(r.t);if(r.g!==undefined)out.gear=addGear(r.g);if(r.card)out.cd=addCard();if(r.ch!==undefined)out.chr=giveCh(r.ch);return out}
function psClaim(l,prem){psCheck();const p=C().ps,list=prem?p.cp:p.cl;if(l<1||l>psLv()||list.includes(l)||(prem&&!p.prem))return null;list.push(l);return grant(psRew(l,prem))}
const psCan=()=>{psCheck();const p=C().ps,lv=psLv();for(let l=1;l<=lv;l++)if(!p.cl.includes(l)||(p.prem&&!p.cp.includes(l)))return true;return false};

// ---- Invasione dei boss: ogni fine settimana (sabato e domenica). Nemici +25% vita, monete x2, punti per ogni vittoria e classifica locale ----
const IV_EX=CH.findIndex(c=>c.ex==='iv');
const dow=()=>((dayNum()+3)%7+7)%7,ivWeek=()=>Math.floor((dayNum()+3)/7);
const ivOn=()=>dow()>=5;
const ivPts=(s,boss)=>Math.ceil(s/5)*(boss?5:1);
const RIV=['Dott. Zorg','Ingrid Volt','Mastro Fuliggine','Luna Bécher','Prof. Tentacolo','Nina Spora','Baron Fiala','Kiko Muffa','Sir Provetta'],RIVM=[2.4,1.9,1.5,1.2,1,.8,.6,.45,.3];
function ivCheck(){const c=C(),wk=ivWeek();if(ivOn()&&c.iv.wk!==wk){const old=c.iv.pts>0&&!c.iv.cl?ivClaim():null;c.iv={wk,pts:0,cl:0,b:Math.max(1,S.bs)};return old}return null}
const ivEnded=()=>{const iv=C().iv;return iv.wk>=0&&(iv.wk<ivWeek()||!ivOn())};
// Avanzamento del fine settimana (0 → 1): i rivali salgono col tempo, il loro punteggio finale dipende dal livello che avevi all'inizio
function ivProg(){const iv=C().iv;if(iv.wk<0)return 0;if(iv.wk<ivWeek())return 1;if(!ivOn())return 0;
 const sat=(iv.wk*7-3+5)*864e5+new Date().getTimezoneOffset()*6e4;return Math.max(0,Math.min(1,(Date.now()-sat)/(2*864e5)))}
function ivBoard(){const iv=C().iv,k=180*Math.ceil(iv.b/5),p=ivProg();
 const rows=RIV.map((n,j)=>({n,p:Math.round(k*RIVM[j]*(.9+.2*((iv.wk*7+j*13)%10)/10)*p)}));rows.push({n:'',me:1,p:iv.pts});
 return rows.sort((a,b)=>b.p-a.p||(a.me?-1:1))}
const ivRank=()=>ivBoard().findIndex(r=>r.me)+1;
const ivRew=r=>r===1?{t:30,ch:IV_EX}:r<=3?{t:20,ch:IV_EX}:r<=6?{t:10}:{t:4};
function ivAdd(s,boss){ivCheck();if(!ivOn())return 0;const n=ivPts(s,boss);C().iv.pts+=n;return n}
function ivClaim(){const iv=C().iv;if(iv.cl||iv.pts<=0||!(iv.wk<ivWeek()||!ivOn()))return null;iv.cl=1;const r=ivRank();return{rank:r,...grant(ivRew(r))}}

// ---- Salvataggi rovinati: ogni campo torna a un valore valido ----
const fin=(x,dv,lo=0,hi=Infinity)=>typeof x==='number'&&isFinite(x)?Math.min(hi,Math.max(lo,x)):dv;
const okId=i=>Number.isInteger(+i)&&+i>=0&&+i<CH.length;
function sanCh(x){const d=defCh(),o=x&&typeof x==='object'&&!Array.isArray(x)?x:{};const c={...d};
 c.t=Math.floor(fin(o.t,0));c.pr=Math.floor(fin(o.pr,0,0,PITY_R));c.pl=Math.floor(fin(o.pl,0,0,PITY_L));c.n=Math.floor(fin(o.n,0));c.free=fin(o.free,0,0,Date.now());
 c.adD=Math.floor(fin(o.adD,-1,-1,1e9));c.adN=Math.floor(fin(o.adN,0,0,AD_MAX));c.nid=Math.floor(fin(o.nid,1,1));
 const own=o.own&&typeof o.own==='object'?o.own:{};c.own={};for(const k in own)if(okId(k)){const s=Math.floor(fin(own[k],0,0,MAXSTAR));if(s)c.own[k]=s}
 const cp=o.cp&&typeof o.cp==='object'?o.cp:{};c.cp={};for(const k in cp)if(c.own[k]&&c.own[k]<MAXSTAR){const v=Math.floor(fin(cp[k],0,0,3*MAXSTAR));if(v)c.cp[k]=v}
 c.ld=(Array.isArray(o.ld)?o.ld:[]).filter(i=>Number.isInteger(i)&&c.own[i]).filter((i,j,a)=>a.indexOf(i)===j).slice(0,LDMAX);
 c.gear=(Array.isArray(o.gear)?o.gear:[]).filter(g=>g&&typeof g==='object'&&Number.isInteger(g.id)&&[0,1,2].includes(g.s)&&[0,1,2,3].includes(g.r)).map(g=>({id:g.id,s:g.s,r:g.r,v:Math.floor(fin(g.v,1,1,100))})).slice(0,GEARMAX+5);
 for(const g of c.gear)c.nid=Math.max(c.nid,g.id+1);
 const ids=new Set(c.gear.map(g=>g.id)),eq=o.eq&&typeof o.eq==='object'?o.eq:{};c.eq={};
 for(const k in eq)if(c.own[k]&&Array.isArray(eq[k]))c.eq[k]=[0,1,2].map(s=>{const id=eq[k][s];const g=c.gear.find(x=>x.id===id);return ids.has(id)&&g&&g.s===s?id:0});
 const tw=o.tw&&typeof o.tw==='object'?o.tw:{};c.tw={d:Math.floor(fin(tw.d,-1,-1,1e9)),tries:Math.floor(fin(tw.tries,TW_TRIES,0,TW_TRIES)),run:tw.run?1:0,f:Math.floor(fin(tw.f,1,1,1e4)),best:Math.floor(fin(tw.best,0,0,1e4)),rec:Math.floor(fin(tw.rec,0,0,1e4)),
  buf:(Array.isArray(tw.buf)?tw.buf:[]).filter(k=>BUFS.some(b=>b.k===k)).slice(0,1e3),ch:Array.isArray(tw.ch)?tw.ch.filter(k=>BUFS.some(b=>b.k===k)).slice(0,3):null};
 if(c.tw.ch&&!c.tw.ch.length)c.tw.ch=null;
 const ps=o.ps&&typeof o.ps==='object'?o.ps:{},lvl=a=>(Array.isArray(a)?a:[]).filter(l=>Number.isInteger(l)&&l>=1&&l<=PS_LV).filter((l,j,a2)=>a2.indexOf(l)===j);
 c.man=o.man?1:0;c.ps={o:Math.floor(fin(ps.o,-1,-1,1e9)),s:Math.floor(fin(ps.s,-1,-1,1e9)),xp:Math.floor(fin(ps.xp,0,0,PS_LV*PS_XP)),cl:lvl(ps.cl),cp:lvl(ps.cp),prem:ps.prem?1:0,dd:Math.floor(fin(ps.dd,-1,-1,1e9)),dm:Math.floor(fin(ps.dm,0,0,PS_CAP)),dw:Math.floor(fin(ps.dw,0,0,PS_CAP))};
 const iv=o.iv&&typeof o.iv==='object'?o.iv:{};c.iv={wk:Math.floor(fin(iv.wk,-1,-1,1e9)),pts:Math.floor(fin(iv.pts,0)),cl:iv.cl?1:0,b:Math.floor(fin(iv.b,1,1))};
 c.cards=d.cards.map((_,k)=>Math.floor(fin(Array.isArray(o.cards)?o.cards[k]:0,0,0,999)));
 c.alb=[0,1].map(a=>Array.isArray(o.alb)&&o.alb[a]&&c.cards.slice(a*9,a*9+9).every(n=>n>0)?1:0);
 return c}

// Collegamenti col resto del gioco (niente import circolari: combat ed economy espongono dei ganci)
setCK('el',el=>1+sk('atkEl',el));setCK('atk',atkMul);setCK('hp',hpMul);
setHook('inc',incMul);setHook('egg',()=>Math.max(.5,1-sk('egg')));
setCK('ehp',()=>ivOn()?1.25:1);

export {LEADB,form,needCp,cps,C as ch,expMulCh,defCh,sanCh,LDMAX,FREE_CD,AD_MAX,star,sMul,skVal,busy,leaders,sk,leadAtk,gearOf,atkMul,hpMul,incMul,goldMul,cdMul,luckAdd,bossStun,slamMul,bossMul,setLeader,
 rollRar,giveCh,pull1,pullT,pullFree,pullAd,freeLeft,adLeft,addT,gearRar,addGear,salvage,equip,unequip,autoEquip,SALV,
 addCard,albHave,albDone,albDup,albClaim,albTrade,ALB_T,
 TW_TRIES,BUFS,twCheck,twStage,twBoss,twSim,twStart,twFight,twPick,twQuit,twBuf,
 PS_LV,PS_XP,psSeason,psLeft,psCheck,psLv,psAdd,psRew,psClaim,psCan,grant,SEASON_CH,
 IV_EX,ivOn,ivWeek,ivPts,ivCheck,ivEnded,ivBoard,ivRank,ivRew,ivAdd,ivClaim,ivProg,RIV,elOf};

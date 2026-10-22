// Test della progressione permanente (senza interfaccia): Portale, stelle, garanzie, equipaggiamento, Torre, Pass, Invasione, album, salvataggi rovinati.
//   npm test
import {S,setS,def} from '../src/core/state.js';
import {CH,PITY_R,PITY_L,MAXSTAR,GEARMAX} from '../src/data/champs.js';
import * as M from '../src/game/meta.js';
import {tAtk,tHp,eHp,faction} from '../src/game/combat.js';
import {inc,dayNum,PG1,pgain,mergePairs} from '../src/game/economy.js';
let fails=0;const ok=(c,m)=>{console.log((c?'✓ ':'✗ ')+m);if(!c)fails++};
const fresh=(o={})=>{setS({...def(),...o});S.tut=3};
const LEG=CH.findIndex(c=>c.r===3),RARE=CH.findIndex(c=>c.r===1),INC=CH.findIndex(c=>c.r===2&&c.sk==='inc');
const D0=Date.now;const at=ms=>{Date.now=()=>ms};const back=()=>{Date.now=D0};

// Portale: garanzia del raro e del leggendario
{fresh();let worst=0,gapR=0;M.ch().t=500;const out=M.pullT(500);
 for(const o of out){if(CH[o.i].r>=1){worst=Math.max(worst,gapR);gapR=0}else gapR++}
 const back5=out.reduce((n,o)=>n+(o.back||0),0);ok(out.length===500&&M.ch().t===back5,'500 evocazioni con 500 biglietti (doppioni oltre ★5: +'+back5+' 🎫 indietro)');
 ok(worst<PITY_R,'mai più di '+(PITY_R-1)+' comuni di fila (peggio: '+worst+')');
 let gapL=0,wl=0;for(const o of out){if(CH[o.i].r===3){wl=Math.max(wl,gapL);gapL=0}else gapL++}
 ok(wl<PITY_L,'un leggendario entro '+PITY_L+' evocazioni (peggio: '+wl+')');
 ok(out.every(o=>!CH[o.i].ex),'gli esclusivi non escono dal Portale');
 ok(Object.values(M.ch().own).every(s=>s>=1&&s<=MAXSTAR),'stelle sempre tra 1 e '+MAXSTAR);
 M.ch().t=0;ok(M.pullT(1)===null,'senza biglietti niente evocazione')}
// Evoluzioni: una famiglia a 3 forme cambia immagine a ★3 e ★5, a 2 forme a ★4
{fresh();const f3=CH.findIndex(c=>c.f.length===3),f2=CH.findIndex(c=>c.f.length===2);M.giveCh(f3);M.giveCh(f2);const a=M.form(f3),b=M.form(f2);
 const forms=new Set([a]);let evo=0;for(let n=0;n<40&&M.star(f3)<MAXSTAR;n++){const r=M.giveCh(f3);if(r.evo)evo++;forms.add(M.form(f3))}
 ok(a===CH[f3].f[0]&&forms.size===3&&evo===2&&M.form(f3)===CH[f3].f[2],'famiglia a 3 forme: '+[...forms].join(' → ')+' (2 evoluzioni)');
 for(let n=0;n<40&&M.star(f2)<4;n++)M.giveCh(f2);ok(b===CH[f2].f[0]&&M.form(f2)===CH[f2].f[1],'famiglia a 2 forme: evolve a ★4 ('+b+' → '+M.form(f2)+')');
 ok(CH.filter(c=>c.ex).every(c=>c.r===4)&&CH.some(c=>c.ex==='tw'),'speciali: Invasione, Pass e Torre')}
// Doppioni oltre ★5: biglietti indietro
{fresh();let n=0;while(M.star(0)<MAXSTAR&&n<100){M.giveCh(0);n++}ok(n===31,'da ★1 a ★5 servono 30 doppioni (3, 6, 9, 12): '+(n-1));
 const c0=S.c,r=M.giveCh(0);ok(M.star(0)===MAXSTAR&&r.back===0&&r.co>=0&&S.c>=c0&&M.ch().t===0,'campione comune già a ★5: monete, nessun biglietto');
 M.ch().own[LEG]=MAXSTAR;const r2=M.giveCh(LEG);ok(r2.back===2,'leggendario già a ★5: 2 biglietti');
 // con tutto a ★5 il rimborso medio resta sotto 1 biglietto per evocazione (niente evocazioni infinite)
 for(let i=0;i<CH.length;i++)M.ch().own[i]=MAXSTAR;M.ch().t=1000;M.pullT(1000);ok(M.ch().t<300,'tutto a ★5: 1000 evocazioni rendono '+M.ch().t+' biglietti (< 1 a evocazione)')}
// Capi: effetti sui moltiplicatori, i capi in spedizione non contano
{fresh();S.g=[8,8,8,8,0];const a0=tAtk(),h0=tHp(),i0=inc();M.giveCh(LEG);M.giveCh(RARE);M.giveCh(INC);
 ok(M.leaders().length===2,'al massimo 2 capi');ok(tAtk()>a0,'un capo aumenta l\'attacco della squadra');
 M.setLeader(INC,true);ok(M.leaders().includes(INC)&&inc()>i0,M.form(INC)+' a capo: guadagni più alti');
 S.exp.run=[{q:0,st:Date.now(),et:Date.now()+1e6,v:1,c:INC}];ok(!M.leaders().includes(INC),'un capo in spedizione non guida la squadra');
 ok(M.expMulCh(LEG)>1.5&&M.expMulCh(-1)===1,'un campione leggendario in spedizione: premio ×'+M.expMulCh(LEG).toFixed(2))}
// Bonus elemento
{fresh();S.g=[4,7,12,13];ok(faction()===1.4,'4 mostri 🔥 in squadra: +40%');S.g=[4,7,12,2];ok(faction()===1.2,'3 mostri 🔥: +20%');S.g=[1,2,3,4];ok(faction()===1,'elementi misti: nessun bonus')}
// Equipaggiamento: tetto all'inventario, auto-equip, smontare
{fresh();M.giveCh(LEG);for(let k=0;k<GEARMAX+10;k++)M.addGear(k%4);ok(M.ch().gear.length<=GEARMAX,'inventario al massimo '+GEARMAX+' pezzi (in più: smontati)');
 M.autoEquip();const eq=M.ch().eq[LEG];ok(eq&&eq.every(id=>id>0),'auto-equip riempie i 3 slot del capo');
 const a=tAtk(),id=eq[0];const v=M.salvage(id);ok(v>0&&M.ch().eq[LEG][0]===0&&tAtk()<=a,'smontare un pezzo equipaggiato lo toglie e dà monete')}
// Torre: 3 tentativi, premi solo la prima volta nella giornata
{fresh();S.g=[10,10,10,10];S.bs=8;M.twCheck();let t=0;while(M.twStart()){t++;for(let k=0;k<50;k++){const r=M.twFight();if(!r||!r.win)break;M.twPick(M.ch().tw.ch[0])}}
 ok(t===3&&M.ch().tw.tries===0&&!M.twStart(),'3 tentativi al giorno');const tk=M.ch().t;
 ok(M.ch().tw.best>=5&&tk>=3,'biglietti per i piani superati (record '+M.ch().tw.best+', 🎫 '+tk+')')}
// Pass: tetto giornaliero per unioni e vittorie, livelli e premi
{fresh();M.psAdd(1000,'m');M.psAdd(1000,'w');ok(M.ch().ps.xp===120,'unioni e vittorie: al massimo 60 PE al giorno ciascuna');
 M.psAdd(30*M.PS_XP);ok(M.psLv()===30,'livello massimo 30');ok(M.psClaim(1,1)===null,'premium bloccato senza sblocco');
 const r=M.psClaim(30,0);ok(r&&r.chr&&CH[r.chr.i].ex==='ps','livello 30: campione esclusivo 🦚');ok(M.psClaim(30,0)===null,'un premio si riscuote una volta sola')
 // premium a video: PS_ADS video per ogni premio 👑, solo per i livelli raggiunti
 {const t0=M.ch().t;for(let k=1;k<M.PS_ADS;k++){const x=M.psAd(2);ok(x&&x.n===k&&!x.got,'video '+k+'/'+M.PS_ADS+' per il premio 👑 del livello 2')}
  const x=M.psAd(2);ok(x&&x.got&&M.ch().ps.cp.includes(2)&&M.ch().t>t0,'al '+M.PS_ADS+'° video il premio 👑 arriva da solo');ok(M.psAd(2)===null,'premio 👑 già preso: niente altri video')}
 // premi più ricchi: ogni livello gratis dà qualcosa, i premium hanno anche Essenze e monete
 {let e=0,c=0;for(let l=1;l<=M.PS_LV;l++){const r=M.psRew(l,1);e+=r.e||0;c+=r.c||0}ok(e>=15&&c>=40,'premium: '+e+' Essenze e monete in tutta la stagione')}
 {const e0=S.essT,c0=S.c;const o=M.grant({e:2,c:3});ok(S.essT===e0+2&&S.c>c0&&o.co>0,'grant: Essenze e monete consegnate')}
 // acquisto: Premium attivo per la stagione, poi i premi 👑 si riscuotono normalmente
 M.psBuy();ok(M.ch().ps.prem===1&&M.psClaim(3,1)!==null&&M.psAd(4)===null,'Premium comprato: premi 👑 riscuotibili, niente video')}
// Invasione: attiva solo nel fine settimana, punti, classifica, premio a fine evento
{fresh();S.bs=20;const d=dayNum(),dw=((d+3)%7+7)%7,sat=(d+(5-dw+7)%7)*864e5+new Date().getTimezoneOffset()*6e4;
 at(sat+12*3600e3);ok(M.ivOn(),'sabato: invasione attiva');ok(eHp(7)>Math.floor(30*Math.pow(1.45,6)),'durante l\'invasione i nemici hanno più vita');
 M.ivAdd(20,true);M.ivAdd(20,false);ok(M.ch().iv.pts===24,'punti: boss ×5 (20+4)');ok(M.ivClaim()===null,'niente premio mentre l\'evento è in corso');
 M.ch().iv.pts=1e6;at(sat+3*864e5);ok(!M.ivOn(),'martedì: finita');const r=M.ivClaim();ok(r&&r.rank===1&&r.chr,'primo in classifica: Gorilla Invasore');ok(M.ivClaim()===null,'premio una volta sola');back()}
// Album
{fresh();for(let k=0;k<400;k++)M.addCard();ok(M.albDone(0)||M.albTrade(0)!==null,'con abbastanza figurine l\'album si completa o si scambia');
 while(!M.albDone(0)&&M.albTrade(0));if(M.albDone(0)){const i0=inc();ok(M.albClaim(0)&&M.ch().alb[0]===1,'album completo: premio riscosso');ok(M.albClaim(0)===false,'una volta sola')}}
// Varianti dorate e prima Evocazione oscura
{fresh();S.g=[5,5,0];S.gv=[1,0,0];const i1=inc();S.gv=[0,0,0];ok(Math.abs(i1/inc()-2)<1e-9,'un mostro dorato rende ×3 (2 mostri: ×2 sul totale)');
 const g=[3,3,4,4],gv=[1,1,1,0];mergePairs(g,gv);ok(gv[0]===1&&gv[2]===0&&gv[1]===0,'unione: dorato solo se lo sono entrambi');
 fresh();S.run=PG1;ok(pgain()===1,'prima Evocazione oscura: la prima Essenza a '+PG1+' monete');S.ach.pr=1;ok(pgain()===0,'dalle successive la soglia torna normale')}
// Salvataggi rovinati
{const bad=[null,5,'x',[],{t:'a',own:{0:99,99:3,x:2},ld:[0,0,77],gear:[{id:1,s:9,r:1},{id:2,s:0,r:2,v:1e9}],eq:{0:[2,2,2]},tw:{tries:-4,buf:['z'],ch:[]},ps:{xp:-1,cl:[0,1,1,99]},iv:{pts:NaN},cards:[NaN,5]}];
 for(const b of bad){const c=M.sanCh(b);fresh();S.ch=c;let e=null;try{M.leaders();tAtk();inc();M.psCan();M.twSim(1);M.ivBoard()}catch(x){e=x}ok(!e&&c.t>=0&&c.tw.tries>=0&&c.cards.length===18,'salvataggio rovinato ('+JSON.stringify(b).slice(0,30)+'): campioni riparati')}
 const c=M.sanCh(bad[4]);ok(c.own[0]===MAXSTAR&&!c.own[99]&&c.ld.length===1&&c.gear.length===1&&c.gear[0].v===100&&c.eq[0][0]===2&&c.eq[0][1]===0,'campi impossibili corretti (stelle, capi, equipaggiamento)')}
// Ogni rarità (compresa la Speciale) ha i suoi valori: niente NaN nei testi e nei bonus
{for(let r=0;r<=4;r++)ok(isFinite(M.LEADB[r]),'bonus da capo definito per la rarità '+r);
 fresh();for(let i=0;i<CH.length;i++){M.ch().own[i]=1;M.ch().ld=[i];ok(isFinite(M.atkMul())&&isFinite(M.expMulCh(i))&&isFinite(M.skVal(i)),'valori finiti: '+M.form(i))}}
process.exit(fails?1:0);

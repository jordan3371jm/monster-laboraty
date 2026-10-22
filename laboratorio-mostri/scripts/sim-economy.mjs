// Simulazione dell'economia: un giocatore "ragionevole" gioca online, senza pubblicità né eventi.
// Usa le stesse formule del gioco (src/game/*), quindi ogni cambio di numeri si vede qui.
//
//   npm run sim            stampa i tempi (ore di gioco) per raggiungere ogni traguardo
//   npm test               confronta i tempi con scripts/economy-baseline.json (±TOL) e fallisce se deviano
//   npm run sim:update     riscrive la baseline dopo un cambio di numeri voluto
//
// Semplificazioni dichiarate: le abilità attive non entrano nei combattimenti (stima prudente), niente forzieri,
// niente guadagni offline, il giocatore unisce/compra una volta al secondo. Servono per i confronti, non come previsione assoluta.
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {MAXT,WS} from '../src/data/config.js';
import {S,setS,def} from '../src/core/state.js';
import {AE_COST,eggInt,inc,spCost,UP,PK,earn,pgain,mergePairs,prestigeState,spT,freeCell} from '../src/game/economy.js';
import {fightTime,stageReward} from '../src/game/combat.js';

const HOURS=+(process.env.SIM_HOURS||48),TOL=+(process.env.SIM_TOL||0.2);
const BASE=fileURLToPath(new URL('./economy-baseline.json',import.meta.url));
const MODE=process.argv[2]||'print';

// Il tempo per vincere un livello (fightTime) è condiviso con il gioco: src/game/combat.js
const maxTier=()=>Math.max(0,...S.g);
function run(){
  setS(def());S.tut=3;
  const ev={}; // traguardo -> secondi di gioco
  const mark=(k,t)=>{if(ev[k]===undefined)ev[k]=t};
  let eggT=0,fightProg=0,fightFor=0,prestiges=0,sinceP=0;
  for(let t=1;t<=HOURS*3600;t++){
    earn(inc());sinceP++;
    // unioni: tutte le coppie, ogni secondo
    mergePairs(S.g);
    // incubatrice automatica: un uovo gratis ogni eggInt() secondi se c'è una cella libera
    if(eggInt()&&++eggT>=eggInt()){const f=freeCell();if(f>=0){S.g[f]=spT();eggT=0}}
    // evocazioni finché c'è spazio e monete
    for(let free=freeCell();free>=0&&S.c>=spCost();free=freeCell()){S.c-=spCost();S.sp++;S.g[free]=spT()}
    // potenziamenti: i più utili per primi, solo se non tolgono l'evocazione di quel momento
    for(let i=0;i<UP.length;i++){const u=UP[i],l=S.up[u.k];if(i===2||UP[i].am||UP[i].off)continue; // «Sonno profondo» serve solo offline; l'Unione automatica non serve a chi unisce a mano ogni secondo
      if(l<u.max&&S.c>=u.cost(l)*(i===0?1:2)){S.c-=u.cost(l);S.up[u.k]++}}
    // Incubatrice automatica: si sblocca con AE_COST Essenze appena ci sono (poi i livelli si comprano con le monete)
    if(!S.ae&&S.ess>=AE_COST&&S.bs>=10){S.ess-=AE_COST;S.ae=1}
    // albero delle Essenze: Avidità, Uova antiche, Bottino, Abilità, Sonno lungo
    for(const k of ['g','s','b','a','o']){const p=PK.find(x=>x.k===k),l=S.pk[k];if(l<p.max&&S.ess>=p.cost[l]){S.ess-=p.cost[l];S.pk[k]++}}
    // battaglia
    // il tempo di combattimento si ricalcola ogni secondo: se la squadra diventa più forte, il livello si sblocca
    if(fightFor!==S.st){fightFor=S.st;fightProg=0}
    const T=fightTime(S.st);
    if(isFinite(T)){fightProg+=1/(T+1);if(fightProg>=1){earn(stageReward(S.st));S.st++;if(S.st>S.bs)S.bs=S.st;fightFor=0;mark('stage'+S.st,t)}}
    const mt=maxTier();[5,10,13,14,20,26].forEach(x=>{if(mt>=x)mark('mostro'+x,t)});
    if(mt>WS)S.wd=2;
    // Evocazione oscura: appena le Essenze guadagnate sono almeno il 40% di quelle già ottenute (e almeno 3)
    const pg=pgain();
    if(pg>=3&&pg>=.4*S.essT&&sinceP>600){setS(prestigeState(S,pg));prestiges++;sinceP=0;fightFor=0;mark('prestigio'+prestiges,t)}
  }
  return {ev,final:{stage:S.bs,tier:maxTier(),essenze:S.essT,prestigi:prestiges}};
}
const hrs=s=>+(s/3600).toFixed(2);
const {ev,final}=run();
const out={};for(const k of Object.keys(ev)){if(/^stage(5|10|20|30|40|50|75|100|150)$/.test(k)||/^mostro\d+$/.test(k)||/^prestigio([1-9]|10)$/.test(k))out[k]=hrs(ev[k])}
console.log(`Simulazione ${HOURS}h di gioco online — ore per traguardo:`);
console.table(Object.fromEntries(Object.entries(out).map(([k,v])=>[k,{ore:v}])));
console.log('Alla fine:',final);
if(MODE==='update'){fs.writeFileSync(BASE,JSON.stringify({ore:HOURS,traguardi:out},null,1)+'\n');console.log('Baseline aggiornata:',BASE);process.exit(0)}
if(MODE==='check'){
  const b=JSON.parse(fs.readFileSync(BASE,'utf8'));let bad=0;
  for(const [k,v] of Object.entries(b.traguardi)){const n=out[k];
    if(n===undefined){console.log(`✗ ${k}: prima ${v}h, ora non raggiunto`);bad++}
    else if(Math.abs(n-v)>Math.max(.05,v*TOL)){console.log(`✗ ${k}: prima ${v}h, ora ${n}h (oltre ±${TOL*100}%)`);bad++}}
  for(const k of Object.keys(out))if(!(k in b.traguardi)){console.log(`✗ ${k}: nuovo traguardo raggiunto (${out[k]}h), non nella baseline`);bad++}
  console.log(bad?`\n${bad} traguardi fuori baseline. Se il cambio è voluto: npm run sim:update`:'\nEconomia in linea con la baseline ✓');
  process.exit(bad?1:0)}

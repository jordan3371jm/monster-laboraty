import {S} from '../core/state.js';

// ---- Sblocchi a obiettivi: all'inizio c'è solo il laboratorio, ogni sistema si apre raggiungendo un traguardo ----
// Requisito: m = crea un mostro di livello n, s = raggiungi il livello di battaglia n, c = guadagna n monete in questa partita,
// p = fai n Evocazioni oscure. Ciò che è sbloccato resta in S.ul (anche dopo l'Evocazione oscura), quindi non si richiude mai.
// L'ordine della lista è quello in cui la barra «prossimo obiettivo» propone gli sblocchi.
const UL=[
 {k:'ups',m:3,ic:'⚙️'},{k:'bat',m:4,ic:'⚔️'},{k:'day',m:5,ic:'🎁'},{k:'ads',s:4,ic:'⚡'},{k:'col',m:6,ic:'📖'},
 {k:'tr',s:8,ic:'🏆'},{k:'pr',c:25000,ic:'🔮'},{k:'fm',s:12,ic:'🔁'},{k:'exp',m:7,ic:'🧭'},{k:'por',p:1,ic:'🌀'},
 {k:'pas',s:20,ic:'🎟️'},{k:'tow',s:25,ic:'🗼'},{k:'inv',s:30,ic:'🔥'}];
// Potenziamenti: i primi due ci sono da subito, gli altri si aggiungono man mano (indice in UP di economy.js)
const UPL=[null,null,{m:5},{m:6},{m:7},{s:10}];
const disc=()=>S.disc.filter(Boolean).length;
// avanzamento verso il requisito, da 0 a 1
function rqP(r){const [v,n]=r.m?[disc(),r.m]:r.s?[S.bs,r.s]:r.c?[S.run,r.c]:[S.ach.pr,r.p];return Math.max(0,Math.min(1,v/n))}
const has=k=>S.ul.includes(k);
const upOpen=i=>!UPL[i]||has('u'+i);
// Sblocca ciò che ha raggiunto il requisito; restituisce le novità (le chiamate successive non le ripetono)
function ulCheck(){if(S.tut<3)return[];const out=[];
 for(const u of UL)if(!has(u.k)&&rqP(u)>=1){S.ul.push(u.k);out.push({k:u.k,ic:u.ic})}
 UPL.forEach((r,i)=>{if(r&&!has('u'+i)&&rqP(r)>=1){S.ul.push('u'+i);out.push({k:'u'+i,up:i})}});
 return out}
const ulNext=()=>UL.find(u=>!has(u.k));
// Salvataggi delle versioni precedenti (senza il segno 'v2'): chi aveva già fatto un'Evocazione oscura o era oltre il
// livello 15 trovava tutto aperto e così resta; per gli altri contano i requisiti (chi li ha già raggiunti li trova aperti).
function ulMigrate(){if(has('v2'))return;
 if(S.tut>=3&&(S.ach.pr>0||S.bs>=15))for(const k of [...UL.map(u=>u.k),'u2','u3','u4','u5'])if(!has(k))S.ul.push(k);
 S.ul.push('v2');ulCheck()}
export {UL,UPL,rqP,has,upOpen,ulCheck,ulNext,ulMigrate};

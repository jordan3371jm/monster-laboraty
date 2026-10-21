// ---- Campioni del Portale: mostri unici (diversi dai 26 del laboratorio) che guidano la squadra ----
// r = rarità (0 comune, 1 raro, 2 epico, 3 leggendario), el = elemento (0 🔥, 1 💧, 2 🌿), sk = abilità, v = valore a ★1 (raddoppia a ★5).
// Abilità: atkEl (+% attacco ai mostri dell'elemento el), atk, hp, inc (guadagni), gold (monete dei livelli), exp (premio spedizioni),
// cd (ricarica abilità), luck (fusione perfetta, punti %), egg (intervallo incubatrice), stun (secondi di stordimento del boss all'inizio),
// slam (danno del colpo a terra), boss (danno contro i boss), all (attacco, vita e guadagni insieme).
// ex: 'iv' = solo dall'Invasione dei boss, 'ps' = solo dal pass stagionale (fuori dal Portale).
const CH=[
 {e:'🦔',r:0,el:2,sk:'atkEl',v:.15,it:'Riccio Pungente',en:'Prickly Hedgehog'},
 {e:'🐧',r:0,el:1,sk:'atkEl',v:.15,it:'Pinguino Glaciale',en:'Glacial Penguin'},
 {e:'🦊',r:0,el:0,sk:'atkEl',v:.15,it:'Volpe di Brace',en:'Ember Fox'},
 {e:'🐞',r:0,el:2,sk:'gold',v:.2,it:'Coccinella Fortunata',en:'Lucky Ladybug'},
 {e:'🦦',r:0,el:1,sk:'exp',v:.2,it:'Lontra Esploratrice',en:'Explorer Otter'},
 {e:'🐿️',r:0,el:0,sk:'cd',v:.08,it:'Scoiattolo Lampo',en:'Flash Squirrel'},
 {e:'🦉',r:1,el:1,sk:'inc',v:.12,it:'Gufo Saggio',en:'Wise Owl'},
 {e:'🐻',r:1,el:2,sk:'hp',v:.2,it:'Orso Guardiano',en:'Guardian Bear'},
 {e:'🐯',r:1,el:0,sk:'atk',v:.15,it:'Tigre Ardente',en:'Blazing Tiger'},
 {e:'🦋',r:1,el:2,sk:'luck',v:.03,it:'Farfalla Onirica',en:'Dream Butterfly'},
 {e:'🐝',r:1,el:0,sk:'egg',v:.12,it:'Ape Operaia',en:'Worker Bee'},
 {e:'🦁',r:2,el:0,sk:'stun',v:2,it:'Leone Reale',en:'Royal Lion'},
 {e:'🧜',r:2,el:1,sk:'slam',v:.4,it:'Sirena delle Maree',en:'Tide Mermaid'},
 {e:'🧚',r:2,el:2,sk:'inc',v:.25,it:'Fata del Bosco',en:'Forest Fairy'},
 {e:'🦄',r:3,el:1,sk:'atk',v:.35,it:'Unicorno Celeste',en:'Celestial Unicorn'},
 {e:'🧞',r:3,el:0,sk:'all',v:.2,it:'Genio della Lampada',en:'Lamp Genie'},
 {e:'🦍',r:3,el:2,sk:'boss',v:.5,ex:'iv',it:'Gorilla Invasore',en:'Invader Gorilla'},
 {e:'🦚',r:3,el:1,sk:'all',v:.15,ex:'ps',it:'Pavone delle Stagioni',en:'Season Peacock'}];
const RAR=['⚪','🔵','🟣','🟡'];
// Probabilità del Portale per rarità e garanzie: almeno un raro ogni PITY_R evocazioni, un leggendario entro PITY_L
const ODDS=[.6,.28,.1,.02],PITY_R=10,PITY_L=50,MAXSTAR=5;
// Equipaggiamento: 3 slot (⚔️ attacco, 🛡️ vita, 📿 guadagni), valore % per rarità a ±20%
const GEAR=[{ic:'⚔️',k:'atk'},{ic:'🛡️',k:'hp'},{ic:'📿',k:'inc'}],GEARV=[4,8,14,24],GEARMAX=24;
// Album di figurine: 9 carte per album (le ultime più rare); album completo = premio e bonus permanente
const ALB=[{ic:'🧪',b:'inc',v:.05,c:['🧪','⚗️','🔬','🧫','🧬','💉','🔭','🧲','⚙️']},{ic:'🚀',b:'atk',v:.05,c:['🚀','🛰️','🌍','🪐','☄️','🌙','🛸','🌌','⭐']}];
const CARDW=[10,10,10,10,10,5,5,5,2];
export {CH,RAR,ODDS,PITY_R,PITY_L,MAXSTAR,GEAR,GEARV,GEARMAX,ALB,CARDW};

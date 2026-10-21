// ---- Campioni del Portale: i mostri disegnati (immagini in public/m/<nome>.webp), diversi dai 26 del laboratorio ----
// f = famiglia evolutiva (1, 2 o 3 forme): con 3 forme si evolve a ★3 e a ★5, con 2 forme a ★4. Il nome è quello dell'immagine.
// r = rarità (0 comune, 1 raro, 2 epico, 3 leggendario, 4 speciale), el = elemento (0 🔥, 1 💧, 2 🌿), sk = abilità, v = valore a ★1 (raddoppia a ★5).
// Abilità: atkEl (+% attacco ai mostri dell'elemento el), atk, hp, inc (guadagni), gold (monete dei livelli), exp (premio spedizioni),
// cd (ricarica abilità), luck (fusione perfetta, punti %), egg (intervallo incubatrice), stun (secondi di stordimento del boss all'inizio),
// slam (danno del colpo a terra), boss (danno contro i boss), all (attacco, vita e guadagni insieme).
// ex (speciali, fuori dal Portale): 'iv' = Invasione dei boss, 'ps' = Pass stagionale, 'tw' = primo arrivo al piano 20 della Torre.
// L'ordine NON va cambiato: il salvataggio usa l'indice. I nuovi campioni si aggiungono in fondo.
const CH=[
 {r:0,el:2,sk:'atkEl',v:.15,f:['fanghiglia','melmostro','paludivoro']},
 {r:0,el:0,sk:'atkEl',v:.15,f:['ossetto','ossariano']},
 {r:0,el:1,sk:'atkEl',v:.15,f:['lenzuolino','lenzuolordo']},
 {r:0,el:0,sk:'cd',v:.08,f:['candelino','cerofiamma']},
 {r:0,el:2,sk:'gold',v:.2,f:['mandragolina','mandragurlante']},
 {r:0,el:2,sk:'exp',v:.2,f:['spaventalo','terrificampo']},
 {r:0,el:2,sk:'hp',v:.12,f:['rospofango','tossirana']},
 {r:0,el:0,sk:'atk',v:.08,f:['vespirla','calabronero']},
 {r:0,el:0,sk:'boss',v:.2,f:['manoscura','branciossa']},
 {r:1,el:0,sk:'atk',v:.15,f:['lumizucca','zuccarnivoro','zuccomperatore']},
 {r:1,el:1,sk:'inc',v:.12,f:['nottolino','vesproscuro','nocturnalis']},
 {r:1,el:1,sk:'luck',v:.03,f:['sfortunino','gattojella','panteranima']},
 {r:1,el:2,sk:'hp',v:.2,f:['fungospetto','amaniterror','micotossico']},
 {r:1,el:0,sk:'boss',v:.3,f:['zeccarina','sanguizecca']},
 {r:1,el:1,sk:'egg',v:.12,f:['freddolino','criopinguo']},
 {r:1,el:2,sk:'inc',v:.12,f:['boccettina','alchimistro']},
 {r:1,el:0,sk:'gold',v:.35,f:['corvaglia','cornacchionte']},
 {r:1,el:1,sk:'atkEl',v:.3,f:['piranhondra','pescescuro']},
 {r:1,el:2,sk:'slam',v:.25,f:['gargoyleme']},
 {r:1,el:0,sk:'cd',v:.12,f:['bulonetto']},
 {r:1,el:1,sk:'exp',v:.35,f:['pinguombroso']},
 {r:2,el:0,sk:'atkEl',v:.4,f:['tizzonetto','diablotto','diavolaccio']},
 {r:2,el:1,sk:'atkEl',v:.4,f:['gocciascura','maremora','abissaleviatano']},
 {r:2,el:2,sk:'inc',v:.25,f:['streghetta','fattucchiera','megeracle']},
 {r:2,el:1,sk:'stun',v:2,f:['scintillio','voltempesta','golemvite']},
 {r:2,el:2,sk:'atkEl',v:.4,f:['spinarbo','rovomaledetto','silvanotrico']},
 {r:2,el:1,sk:'slam',v:.4,f:['filospettro','tramante','aracnofante']},
 {r:2,el:1,sk:'luck',v:.05,f:['fantesmina','velospettrale','velanima']},
 {r:2,el:2,sk:'boss',v:.5,f:['basilombra']},
 {r:2,el:1,sk:'atk',v:.25,f:['fulminartico']},
 {r:2,el:0,sk:'hp',v:.35,f:['minotombro']},
 {r:3,el:0,sk:'all',v:.2,f:['chimeracco']},
 {r:3,el:1,sk:'atk',v:.35,f:['grifospettrale']},
 {r:3,el:2,sk:'inc',v:.4,f:['lichiarore']},
 {r:3,el:1,sk:'boss',v:.8,f:['krakentuscolo']},
 {r:3,el:1,sk:'hp',v:.6,f:['criofante']},
 {r:4,el:0,sk:'all',v:.25,ex:'iv',f:['dullaghan']},
 {r:4,el:0,sk:'all',v:.2,ex:'ps',f:['conte_mezzanotte']},
 {r:4,el:2,sk:'atk',v:.5,ex:'tw',f:['ombriel']}];
// Forma attuale secondo le stelle (s): 3 forme → ★1, ★3, ★5; 2 forme → ★1, ★4
const evoAt=c=>c.f.length===3?[1,3,5]:c.f.length===2?[1,4]:[1];
const evoIdx=(c,s)=>{const a=evoAt(c);let k=0;for(let j=0;j<a.length;j++)if(s>=a[j])k=j;return k};
const cName=k=>k.split('_').map(w=>w[0].toUpperCase()+w.slice(1)).join(' ');
const mImg=(k,cls)=>'<img class="mimg'+(cls?' '+cls:'')+'" src="m/'+k+'.webp" alt="" draggable="false">';
const RAR=['⚪','🔵','🟣','🟡','🔴'];
// Probabilità del Portale per rarità e garanzie: almeno un raro ogni PITY_R evocazioni, un leggendario entro PITY_L
const ODDS=[.6,.28,.1,.02],PITY_R=10,PITY_L=50,MAXSTAR=5;
// Equipaggiamento: 3 slot (⚔️ attacco, 🛡️ vita, 📿 guadagni), valore % per rarità a ±20%
const GEAR=[{ic:'⚔️',k:'atk'},{ic:'🛡️',k:'hp'},{ic:'📿',k:'inc'}],GEARV=[4,8,14,24],GEARMAX=24;
// Album di figurine: 9 carte per album (le ultime più rare); album completo = premio e bonus permanente
const ALB=[{ic:'🧪',b:'inc',v:.05,c:['🧪','⚗️','🔬','🧫','🧬','💉','🔭','🧲','⚙️']},{ic:'🚀',b:'atk',v:.05,c:['🚀','🛰️','🌍','🪐','☄️','🌙','🛸','🌌','⭐']}];
const CARDW=[10,10,10,10,10,5,5,5,2];
export {evoAt,evoIdx,cName,mImg,CH,RAR,ODDS,PITY_R,PITY_L,MAXSTAR,GEAR,GEARV,GEARMAX,ALB,CARDW};

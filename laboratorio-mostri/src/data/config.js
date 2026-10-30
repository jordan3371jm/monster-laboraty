const K='ml_save_v1',N=35,BN=20,WS=13,MAXT=39,NR=12, // WS = mostri per mondo, MAXT = mostri totali (3 mondi), NR = righe della collezione (4 per mondo)
// Mostri del laboratorio: ognuno è un carattere privato (U+E001…) che ui/monsters.js sostituisce con il suo disegno (data/monart.js)
// ovunque compaia nella pagina. em = l'emoji di prima, usata solo dove un disegno non può andare (es. testi condivisi).
// Nemici e boss: un'emoji oppure '@nome' = immagine public/m/nome.webp (vedi ico() in core/util.js). tw = boss della Torre.
W=[{em:['🥚','🦠','🐛','🕷️','🦇','🐸','🐺','🧟','🧛','👻','💀','👹','🐉'],en:{n:['@pagliaiostro','@lapidino','@becchino_eterno'],fast:['@tessitelo','@braciodemonio','@vedovamantis'],armor:['@sepolcrodo','@gelartiglio','@aracnoscuro'],heal:['@zuccheterna','@lanternferno','@elixirbecco']},
 bm:['@samhainrex','@pestilenzio','@sovranozucca','@infernax'],tw:['@cimiteronte','@strega_caldera','@scarnatore','@samhainrex']},
{em:['🌑','🪨','☄️','🌙','🪐','🛸','👽','🦞','🐙','🐋','🌀','🌌','🌠'],en:{n:['@pescescuro','@gocciascura','@maremora'],fast:['@piranhondra','@fulminartico','@criopinguo'],armor:['@branciossa','@criofante','@pinguombroso'],heal:['@fantesmina','@velanima','@velospettrale']},
 bm:['@abissorrore','@ectoplasmax','@umbrapredator','@ombrafunebre'],tw:['@abissorrore','@ombrafunebre','@ectoplasmax','@umbrapredator']},
{em:['🔥','🐌','🦀','🪔','🐈','🦎','🗿','🌋','🐤','🛡️','🐲','☀️','❤️‍🔥'],en:{n:['@tizzonetto','@cerofiamma','@scintillio'],fast:['@calabronero','@vespirla','@zeccarina'],armor:['@golemvite','@bulonetto','@gargoyleme'],heal:['@rospofango','@fungospetto','@amaniterror']},
 bm:['@diavolaccio','@diablotto','@voltempesta','@chimeracco'],tw:['@diavolaccio','@chimeracco','@diablotto','@voltempesta']}],
E=Array.from({length:MAXT},(_,i)=>String.fromCharCode(0xE001+i)),EMO=W.flatMap(w=>w.em),EXCL_EMO='🐲'; // EXCL_EMO: il mostro esclusivo della serie di 28 giorni (fuori dai mostri normali)
// Analytics anonime opzionali: metti qui l'indirizzo di un tuo endpoint (POST JSON). Vuoto = nessun invio, i dati restano solo nel salvataggio.
const ANALYTICS_URL='';
export {K,N,BN,WS,MAXT,NR,W,E,EMO,EXCL_EMO,ANALYTICS_URL};

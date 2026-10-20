const K='ml_save_v1',N=28,BN=20,WS=13,MAXT=26,NR=8, // WS = mostri per mondo, MAXT = mostri totali, NR = righe della collezione
W=[{e:['🥚','🦠','🐛','🕷️','🦇','🐸','🐺','🧟','🧛','👻','💀','👹','🐉'],en:{n:['👾','👺','🧌'],fast:['🦂','🐍','🦎'],armor:['🤖','🦖','🐢'],heal:['🧙','🦑','🍄']},bm:['🗿','🐲','☠️','👿']},
{e:['🌑','🪨','☄️','🌙','🪐','🛸','👽','🦞','🐙','🐋','🌀','🌌','🌠'],en:{n:['🐡','🐠','🦐'],fast:['🦈','🐬','🦅'],armor:['🦀','🐚','🐊'],heal:['🌿','🌸','🍀']},bm:['🦑','🌋','👁️','🦕']}],
E=[...W[0].e,...W[1].e],EXCL_EMO='🐲'; // EXCL_EMO: il mostro esclusivo della serie di 28 giorni (fuori dai 26 normali)
// Analytics anonime opzionali: metti qui l'indirizzo di un tuo endpoint (POST JSON). Vuoto = nessun invio, i dati restano solo nel salvataggio.
const ANALYTICS_URL='';
export {K,N,BN,WS,MAXT,NR,W,E,EXCL_EMO,ANALYTICS_URL};

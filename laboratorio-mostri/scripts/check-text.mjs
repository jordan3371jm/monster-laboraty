// Controllo statico dei testi in tutte le lingue (en, it, es, fr, zh):
// - ogni chiave usata con tr()/trv() esiste in inglese (la lingua di riserva);
// - ogni lingua ha esattamente le chiavi dell'inglese, con gli stessi segnaposto ({n}, {e}, {v}…);
// - varianti dei messaggi, storie dei 26 mostri e nomi dei campioni sono completi;
// - elenca le frasi rimaste identiche all'inglese (possibili traduzioni dimenticate), tranne sigle ed emoji.
import {TX,VAR,LANGS} from '../src/data/text.js';
import {LORE} from '../src/data/lore.js';
import {CH} from '../src/data/champs.js';
import {MAXT} from '../src/data/config.js';
import {readdirSync,readFileSync,statSync} from 'node:fs';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=join(dirname(fileURLToPath(import.meta.url)),'..','src');
const files=[];
(function walk(d){for(const f of readdirSync(d)){const p=join(d,f);
 if(statSync(p).isDirectory())walk(p);else if(p.endsWith('.js'))files.push(p)}})(root);
const used=new Set();
for(const f of files){const t=readFileSync(f,'utf8');
 for(const m of t.matchAll(/tr(?:v)?\(\s*'([A-Za-z0-9_]+)'\s*\)/g))used.add(m[1])}

let err=0;const bad=(m,x)=>{console.error('✗ '+m,x||'');err=1};
const ph=s=>(String(s).match(/\{[a-z]\}/g)||[]).sort().join('');
const en=TX.en,enk=Object.keys(en);
const missUse=[...used].filter(k=>!(k in en)&&!(k in VAR.en));if(missUse.length)bad('chiavi usate ma inesistenti:',missUse);
// sigle, emoji e parole uguali in molte lingue: non sono dimenticanze
const SAME=new Set(['Combo','Max','MAX','Premium','BOSS','Boss','Auto','✓','/s','Audio','Sessions','Tickets','Points','Invasion','Collection','Rare','Total','Champion','Animo']);
for(const l of LANGS){const t=TX[l];if(!t){bad(l+': lingua mancante');continue}
 const miss=enk.filter(k=>!(k in t)),extra=Object.keys(t).filter(k=>!(k in en));
 if(miss.length)bad(l+': chiavi mancanti',miss);if(extra.length)bad(l+': chiavi in più',extra);
 const phx=enk.filter(k=>k in t&&ph(t[k])!==ph(en[k]));if(phx.length)bad(l+': segnaposto diversi dall\'inglese',phx);
 const empty=enk.filter(k=>k in t&&!String(t[k]).trim());if(empty.length)bad(l+': testi vuoti',empty);
 const v=VAR[l];if(!v)bad(l+': varianti mancanti');else for(const k in VAR.en)if(!Array.isArray(v[k])||!v[k].length)bad(l+': variante mancante',k);
 const lo=LORE[l];if(!Array.isArray(lo)||lo.length!==MAXT||lo.some(x=>!Array.isArray(x)||x.length!==2||!x[0]||!x[1]))bad(l+': storie dei mostri incomplete');
 const cn=CH.filter(c=>!c[l]);if(cn.length)bad(l+': nomi dei campioni mancanti',cn.map(c=>c.e));
 if(l!=='en'){const same=enk.filter(k=>t[k]===en[k]&&!SAME.has(String(en[k]).replace(/^\W+/,''))&&/[a-z]{3,}/i.test(en[k]));
  if(same.length)console.log('ℹ '+l+': '+same.length+' testi uguali all\'inglese: '+same.join(', '))}}
console.log(err?'check-text: ERRORI':'check-text: OK ('+LANGS.length+' lingue, '+enk.length+' chiavi, '+used.size+' usate)');
process.exit(err)

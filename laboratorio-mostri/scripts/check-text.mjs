// Piccolo controllo statico: verifica che tutte le chiavi di testo usate con tr()/trv()
// esistano sia in italiano che in inglese, e che i due blocchi TX.it / TX.en siano allineati.
import {TX} from '../src/data/text.js';
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

const itk=Object.keys(TX.it),enk=Object.keys(TX.en);
const missIt=itk.filter(k=>!(k in TX.en)),missEn=enk.filter(k=>!(k in TX.it));
const badUse=[...used].filter(k=>!(k in TX.it)||!(k in TX.en));
let err=0;
if(missIt.length){console.error('Chiave IT senza EN:',missIt);err=1}
if(missEn.length){console.error('Chiave EN senza IT:',missEn);err=1}
if(badUse.length){console.error('Chiavi usate ma inesistenti:',badUse);err=1}
console.log(err?'check-text: ERRORI':'check-text: OK ('+itk.length+' chiavi, '+used.size+' usate)');
process.exit(err)

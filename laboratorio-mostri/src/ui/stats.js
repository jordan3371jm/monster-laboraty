import {$} from '../core/dom.js';
import {R,S} from '../core/state.js';
import {fmt} from '../core/util.js';
import {E,MAXT} from '../data/config.js';
import {tr} from '../data/text.js';
import {setT} from './common.js';
import {TOT} from './trophies.js';

const fmtTime=s=>{const m=Math.floor(s/60),h=Math.floor(m/60);return h>=1?h+'h '+m%60+'m':m+'m '+Math.floor(s%60)+'s'};
function renderStats(){const top=S.disc.lastIndexOf(1)+1,rows=[
 ['pt',fmtTime(S.pt||0)],['mg',fmt(S.ach.mg)],['sp',fmt(S.ach.sp)],['wn',fmt(S.ach.wn)],['st',S.bs],
 ['tm',top?E[top-1]+' '+top:'–'],['dc',S.disc.filter(Boolean).length+'/'+MAXT],['lt',fmt(S.lt)],['es',fmt(S.essT)],['pr',S.ach.pr],
 ['ch',S.ach.ch],['ev',S.ach.ev],['ab',fmt(S.ach.ab||0)],['dy',S.dl.st],['tf',R.trC+'/'+TOT],
 ['ss',S.an.ss],['dp',S.an.d.length],['fp',S.an.f.prestige?fmtTime(S.an.f.prestige):'–']];
 setT('statB',rows.map(([k,v])=>'<div class="rw"><span>'+tr('st_'+k)+'</span><b>'+v+'</b></div>').join(''))}
const openStats=()=>{renderStats();$('stat').classList.add('on')};
$('statClose').onclick=()=>$('stat').classList.remove('on');
export {renderStats,openStats};

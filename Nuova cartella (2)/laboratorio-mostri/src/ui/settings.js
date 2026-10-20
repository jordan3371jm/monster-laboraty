import {sfx,toggleAudio} from '../audio.js';
import {$} from '../core/dom.js';
import {R,S,def,setS} from '../core/state.js';
import {tr} from '../data/text.js';
import {save} from '../save.js';
import {startFight} from './battle.js';
import {setT,toast} from './common.js';
import {applyLang,ui} from './hud.js';
import {draw} from './lab.js';
import {dayCheck} from './missions.js';
import {openStats} from './stats.js';
import {tutDraw} from './tutorial.js';
import {initAnalytics} from '../analytics.js';

function renderSet(){const on=k=>S[k]?' g':'';
 setT('setB','<div class="dh">'+tr('setLang')+'</div><div class="row"><button class="b'+(R.lang==='it'?' g':'')+'" data-a="lang" data-v="it">Italiano</button><button class="b'+(R.lang==='en'?' g':'')+'" data-a="lang" data-v="en">English</button></div>'
 +'<div class="dh">'+tr('setAud')+'</div><div class="row"><button class="b'+on('sfxOn')+'" data-a="au" data-v="sfxOn">'+(S.sfxOn?'🔊':'🔇')+' '+tr('setSfx')+'</button><button class="b'+on('musOn')+'" data-a="au" data-v="musOn">'+(S.musOn?'🎵':'🔇')+' '+tr('setMus')+'</button></div>'
 +'<button class="b" data-a="stat">'+tr('setStat')+'</button>'
 +'<div class="dh">'+tr('setData')+'</div>'
 +(R.rs?'<div class="dc">'+tr('rsAsk')+'</div><div class="row"><button class="b r" data-a="rsOk">'+tr('rsYes')+'</button><button class="b" data-a="rsNo">'+tr('rsNo')+'</button></div>':'<button class="b" data-a="rs">'+tr('rsBtn')+'</button>'))}
// Azzeramento: riparte da zero ma tiene lingua e audio scelti; il tutorial ricomincia.
function resetSave(){const x=def();['lp','sfxOn','musOn'].forEach(k=>x[k]=S[k]);setS(x);
 Object.assign(R,{sel:-1,trC:0,mallT:0,autoT:0,evK:null,offA:0,pO:0,pS:0,pB:0,pC:0,chR:null,rs:0,colSel:0,wbInter:''});$('ev').style.display='none';$('wb').classList.remove('on');
 initAnalytics();dayCheck();startFight();tutDraw();draw();save(true);ui();toast(tr('rsDone'))}
const closeSet=()=>{R.rs=0;$('set').classList.remove('on')};
$('tSet').onclick=()=>{R.rs=0;renderSet();$('set').classList.add('on')};$('setClose').onclick=closeSet;
$('setB').onclick=e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,v=b.dataset.v;
 if(a==='lang'){R.lang=v;S.lp=v;applyLang();save()}
 else if(a==='au')toggleAudio(v);
 else if(a==='stat'){closeSet();openStats();return}
 else if(a==='rs'){R.rs=1;sfx('tap')}
 else if(a==='rsNo')R.rs=0;
 else if(a==='rsOk'){closeSet();resetSave();return}
 renderSet();ui()};
export {renderSet};

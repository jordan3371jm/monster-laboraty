import {sfx,toggleAudio} from '../audio.js';
import {$} from '../core/dom.js';
import {R,S,def,setS} from '../core/state.js';
import {LANGN,LANGS,tr} from '../data/text.js';
import {save} from '../save.js';
import {startFight} from './battle.js';
import {onTab,setT,tabs,toast} from './common.js';
import {applyLang,ui} from './hud.js';
import {draw} from './lab.js';
import {dayCheck} from './missions.js';
import {openStats} from './stats.js';
import {tutDraw} from './tutorial.js';
import {initAnalytics,track} from '../analytics.js';
import {authorize,player,social,socials} from '../platform.js';
import {YT} from '../core/env.js';

// Account (salvataggio nel cloud) e condivisione: solo i pulsanti che la piattaforma supporta davvero
const SOCI={share:'📤',addToHomeScreen:'📲',addToFavorites:'⭐',rate:'👍',inviteFriends:'👥',joinCommunity:'💬'};
function platHtml(){const p=player(),so=socials();let h='';
 if(p&&p.can)h+='<div class="dh">'+tr('setAcc')+'</div>'+(p.on?'<div class="rw"><span>👤 '+tr('logged').replace('{n}',p.name||'✓')+'</span><b>☁️</b></div>':'<button class="b g" data-a="login">👤 '+tr('login')+'</button>');
 if(so.length)h+='<div class="dh">'+tr('setSoc')+'</div><div class="lgs">'+so.map(f=>'<button class="b" data-a="soc" data-v="'+f+'">'+SOCI[f]+' '+tr('so_'+f)+'</button>').join('')+'</div>';
 return h}
// Due schede: Gioco (lingua, audio, statistiche) e Account (cloud, social, dati)
let tab=0;
function renderSet(){const on=k=>S[k]?' g':'';
 tabs('setTabs',['🎮','👤'].map((ic,k)=>'<b>'+ic+'</b><small>'+tr(['tbGame','tbAcc'][k])+'</small>'),tab);
 if(tab)return setT('setB',(platHtml()||'')+'<div class="dh">'+tr('setData')+'</div>'
 +(R.rs?'<div class="dc">'+tr('rsAsk')+'</div><div class="row"><button class="b r" data-a="rsOk">'+tr('rsYes')+'</button><button class="b" data-a="rsNo">'+tr('rsNo')+'</button></div>':'<button class="b" data-a="rs">'+tr('rsBtn')+'</button>'));
 setT('setB',(YT?'':'<div class="dh">'+tr('setLang')+'</div><div class="lgs">'+LANGS.map(l=>'<button class="b'+(R.lang===l?' g':'')+'" data-a="lang" data-v="'+l+'">'+LANGN[l]+'</button>').join('')+'</div>')
 +'<div class="dh">'+tr('setAud')+'</div><div class="row"><button class="b'+on('sfxOn')+'" data-a="au" data-v="sfxOn">'+(S.sfxOn?'🔊':'🔇')+' '+tr('setSfx')+'</button><button class="b'+on('musOn')+'" data-a="au" data-v="musOn">'+(S.musOn?'🎵':'🔇')+' '+tr('setMus')+'</button></div>'
 +'<button class="b" data-a="stat">'+tr('setStat')+'</button>')}
// Azzeramento: riparte da zero ma tiene lingua e audio scelti; il tutorial ricomincia.
function resetSave(){const x=def();['lp','sfxOn','musOn','iap'].forEach(k=>x[k]=S[k]);setS(x); // gli acquisti fatti con soldi veri restano
 Object.assign(R,{sel:-1,trC:0,mallT:0,autoT:0,eggT:0,evK:null,offA:0,pO:0,pS:0,pB:0,pC:0,chR:null,rs:0,colSel:0,wbInter:'',ulq:[]});$('ev').style.display='none';$('wb').classList.remove('on');
 initAnalytics();dayCheck();startFight();tutDraw();draw();save(true);ui();toast(tr('rsDone'))}
const closeSet=()=>{R.rs=0;$('set').classList.remove('on')};
onTab('setTabs',k=>{tab=k;R.rs=0;sfx('tap');renderSet()});
$('tSet').onclick=()=>{R.rs=0;tab=0;renderSet();$('set').classList.add('on')};$('setClose').onclick=closeSet;
$('setB').onclick=e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a,v=b.dataset.v;
 if(a==='lang'){R.lang=v;S.lp=v;applyLang();tutDraw();save()}
 else if(a==='au')toggleAudio(v);
 else if(a==='stat'){closeSet();openStats();return}
 else if(a==='login'){authorize().then(()=>{save(true);toast('☁️ '+tr('loginOk'),1);track('login');renderSet()}).catch(()=>{});return}
 else if(a==='soc'){social(v,v==='share'?{text:tr('shareTxt')}:undefined).then(()=>track('social_'+v)).catch(()=>{});return}
 else if(a==='rs'){R.rs=1;sfx('tap')}
 else if(a==='rsNo')R.rs=0;
 else if(a==='rsOk'){closeSet();resetSave();return}
 renderSet();ui()};
export {renderSet};

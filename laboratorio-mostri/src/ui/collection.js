import {sfx} from '../audio.js';
import {$} from '../core/dom.js';
import {R,S} from '../core/state.js';
import {fmt,hueOf} from '../core/util.js';
import {E,MAXT,NR,WS} from '../data/config.js';
import {LORE} from '../data/lore.js';
import {tr} from '../data/text.js';
import {EL,elOf} from '../game/combat.js';
import {give,rBase} from '../game/economy.js';
import {save} from '../save.js';
import {setT,toast} from './common.js';
import {ui} from './hud.js';
import {openWB} from './rewards.js';
import {celebrate} from './cele.js';
import {track} from '../analytics.js';

function disc(t){if(!S.disc[t-1]){S.disc[t-1]=1;if(t>1){toast(tr('newm')+' '+E[t-1],1);sfx('new');if(t>=3)celebrate(t)}}if(t>WS&&S.wd<2)newWorld()} // t>WS e non ===: una fusione perfetta può saltare il primo mostro del mondo 2
function newWorld(){S.wd=2;R.wbInter='world';track('world2');give(rBase()*10,3);sfx('win');
 openWB('<div class="wbi">🌌</div><div class="wbh">'+tr('wNew')+'</div><div class="dc">'+tr('w1n')+'</div><div class="dc">'+tr('wDesc')+'</div><div class="dc">'+tr('wRew')+'</div><button class="b g" data-a="wc">'+tr('wbOk')+'</button>')}
const CR=[{c:1,e:0},{c:2,e:1},{c:4,e:2},{c:10,e:5},{c:25,e:3},{c:50,e:5},{c:100,e:8},{c:250,e:15}],colCoins=r=>Math.floor(rBase()*2*CR[r].c);
// 4 righe per mondo: r>>2 = mondo, r&3 = riga nel mondo
const rowT=r=>{const a=[],w=r>>2,q=r&3;for(let k=0;k<4;k++){const t=w*WS+q*4+k+1;if(t<=(w+1)*WS)a.push(t)}return a};
const rowOk=r=>rowT(r).every(t=>S.disc[t-1]);
function monCard(t){const[n,b]=LORE[R.lang][t-1];return'<div class="mi" style="--h:'+hueOf(t)+'"><i>'+E[t-1]+'</i><div><b>'+n+'</b> · '+tr('monLv')+' '+t+' '+EL[elOf(t)]+'<small>'+b+'</small></div></div>'}
function renderCol(){let h='<div class="cs">'+tr('found')+': <b>'+S.disc.filter(Boolean).length+'/'+MAXT+'</b></div>'+(R.colSel&&S.disc[R.colSel-1]?monCard(R.colSel):'');
 for(let r=0;r<NR;r++){const ok=rowOk(r),cl=S.col[r];if(!(r&3))h+='<div class="wh">'+tr('w'+(r>>2)+'n')+'</div>';
  h+='<div class="cr"><div class="cg">'+rowT(r).map(t=>S.disc[t-1]?'<div class="cm f'+(R.colSel===t?' sl':'')+'" data-a="mon" data-t="'+t+'" style="--h:'+hueOf(t)+'"><i>'+E[t-1]+'</i><small>'+t+'</small></div>':'<div class="cm"><i class="u">'+E[t-1]+'</i><small>?</small></div>').join('')+'</div>'
  +'<button class="b'+(ok&&!cl?' g':'')+'" data-a="col" data-i="'+r+'"'+(ok&&!cl?'':' disabled')+'>'+(cl?'✓ '+tr('claimed'):tr('rew')+': 🪙 '+fmt(colCoins(r))+(CR[r].e?' · 🔮 '+CR[r].e:''))+'</button></div>'}
 setT('colB',h)}
$('tCol').onclick=()=>{renderCol();$('col').classList.add('on')};$('cClose').onclick=()=>$('col').classList.remove('on');
$('colB').onclick=e=>{const b=e.target.closest('[data-a]');if(!b||b.disabled)return;if(b.dataset.a==='mon'){R.colSel=R.colSel===+b.dataset.t?0:+b.dataset.t;sfx('tap');renderCol();return}const r=+b.dataset.i;if(!rowOk(r)||S.col[r])return;
 S.col[r]=1;const c=colCoins(r);give(c,CR[r].e);toast('📖 🪙 +'+fmt(c)+(CR[r].e?' 🔮 +'+CR[r].e:''));sfx('claim');save(true);renderCol();ui()};
export {disc,newWorld,CR,colCoins,rowT,rowOk,renderCol};

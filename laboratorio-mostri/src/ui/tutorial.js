import {$} from '../core/dom.js';
import {S} from '../core/state.js';
import {tr} from '../data/text.js';
import {save} from '../save.js';
import {toast} from './common.js';
import {draw} from './lab.js';
import {track} from '../analytics.js';

function tutDraw(){const t=S.tut,el=$('tut');el.style.display=t<3?'flex':'none';if(t<3)$('tutT').textContent=tr('tut'+t);
 $('spawn').classList.toggle('hl',t===0);$('n1').classList.toggle('hl',t===2)}
function tutNext(to){if(S.tut<to){S.tut=to;if(to>=3){toast(tr('tutEnd'));track('tutorial_done')}tutDraw();draw()}}
$('tutX').onclick=()=>{S.tut=3;track('tutorial_done',{skip:1});tutDraw();draw();save()};
export {tutDraw,tutNext};

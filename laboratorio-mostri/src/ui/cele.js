import {sfx} from '../audio.js';
import {$} from '../core/dom.js';
import {R,S} from '../core/state.js';
import {hueOf} from '../core/util.js';
import {E} from '../data/config.js';
import {LORE} from '../data/lore.js';
import {tr} from '../data/text.js';
import {burst} from './common.js';

// Festeggiamento per un mostro nuovo: scheda al centro (non blocca i tocchi) con l'evoluzione animata (il mostro di prima
// si illumina, lampo, appare quello nuovo con i raggi dietro) e particelle
let tm;
function celebrate(t){const el=$('cele');if(!el||S.tut<3||$('wb').classList.contains('on'))return;
 el.innerHTML='<div class="ci evo" style="--h:'+hueOf(t)+'"><div class="evs"><i class="old">'+E[t-2]+'</i><i class="nw">'+E[t-1]+'</i><span class="fl"></span></div><b>'+tr('newm')+'</b><small>'+LORE[R.lang][t-1][0]+' · '+tr('monLv')+' '+t+'</small></div>';
 el.classList.remove('on');void el.offsetWidth;el.classList.add('on');sfx('new');
 clearTimeout(tm);tm=setTimeout(()=>{burst(el.firstChild,['🎉','✨','⭐'],14);sfx('win')},760);setTimeout(()=>el.classList.remove('on'),2700)}
export {celebrate};

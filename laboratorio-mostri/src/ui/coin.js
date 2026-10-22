import {monOf} from './monsters.js';

// ---- Icone disegnate al posto dei caratteri: la moneta (src/assets/coin.svg) al posto dell'emoji 🪙 e i mostri del laboratorio
// (caratteri privati U+E001…, vedi config.js) al posto del loro segno. Un solo punto per tutto il gioco: ogni testo che entra nella
// pagina (contatori, pulsanti, messaggi, particelle) viene trasformato, così testi e traduzioni restano invariati.
const COIN='🪙',RX=/🪙|[-]/;
function icon(ch){const c=document.createElement(ch===COIN?'i':'em');
 if(ch===COIN){c.className='ico-coin';c.setAttribute('aria-label','coins')}else{c.className='mon m'+monOf(ch);c.setAttribute('role','img')}return c}
function fixText(t){const s=t.nodeValue;if(!s||!RX.test(s)||!t.parentNode)return;const p=t.parentNode;if(p.nodeName==='SCRIPT'||p.nodeName==='STYLE'||p.nodeName==='TITLE')return;
 const f=document.createDocumentFragment();let buf='';
 for(const ch of s){if(ch===COIN||(ch.length===1&&monOf(ch))){if(buf){f.appendChild(document.createTextNode(buf));buf=''}f.appendChild(icon(ch))}else buf+=ch}
 if(buf)f.appendChild(document.createTextNode(buf));p.replaceChild(f,t)}
function fixEl(el){if(!el||el.nodeType!==1||!RX.test(el.textContent))return;const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),l=[];while(w.nextNode())l.push(w.currentNode);l.forEach(fixText)}
function initCoins(){fixEl(document.body);
 new MutationObserver(ms=>{for(const m of ms){if(m.type==='characterData')fixText(m.target);else m.addedNodes.forEach(n=>n.nodeType===3?fixText(n):fixEl(n))}})
  .observe(document.body,{subtree:true,childList:true,characterData:true})}
export {initCoins};

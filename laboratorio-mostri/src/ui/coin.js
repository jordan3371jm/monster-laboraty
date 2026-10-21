// ---- Moneta disegnata (src/assets/coin.svg) al posto dell'emoji 🪙, che su molti dispositivi è brutta o non c'è ----
// Un solo punto per tutto il gioco: ogni testo che contiene 🪙 (contatori, pulsanti, messaggi, particelle) viene
// trasformato in <i class="ico-coin"> appena entra nella pagina, così i testi e le traduzioni restano invariati.
const COIN='🪙';
function fixText(t){const s=t.nodeValue;if(!s||s.indexOf(COIN)<0||!t.parentNode)return;const p=t.parentNode;if(p.nodeName==='SCRIPT'||p.nodeName==='STYLE'||p.nodeName==='TITLE')return;
 const f=document.createDocumentFragment();s.split(COIN).forEach((x,i)=>{if(i){const c=document.createElement('i');c.className='ico-coin';c.setAttribute('aria-label','coins');f.appendChild(c)}if(x)f.appendChild(document.createTextNode(x))});
 p.replaceChild(f,t)}
function fixEl(el){if(!el||el.nodeType!==1||el.textContent.indexOf(COIN)<0)return;const w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),l=[];while(w.nextNode())l.push(w.currentNode);l.forEach(fixText)}
function initCoins(){fixEl(document.body);
 new MutationObserver(ms=>{for(const m of ms){if(m.type==='characterData')fixText(m.target);else m.addedNodes.forEach(n=>n.nodeType===3?fixText(n):fixEl(n))}})
  .observe(document.body,{subtree:true,childList:true,characterData:true})}
export {initCoins};

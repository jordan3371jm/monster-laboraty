// ---- Mostri del laboratorio disegnati a mano in SVG (niente immagini generate): uno per ogni livello, ispirato alla sua storia (lore.js) ----
// Ogni mostro è una funzione che restituisce il contenuto di un <svg viewBox="0 0 100 100">. Pezzi comuni: corpo con sfumatura e
// contorno, occhi con riflesso, bocca, guance. ui/monsters.js li trasforma in immagini (data URI) e li mette al posto dei segni dei mostri.
const OL='#2b1640'; // contorno
const sh=(c,k)=>{const n=parseInt(c.slice(1),16),f=x=>Math.max(0,Math.min(255,Math.round(x*k)));return'#'+[n>>16,n>>8&255,n&255].map(f).map(x=>x.toString(16).padStart(2,'0')).join('')};
let gid=0;
// sfumatura radiale chiara in alto a sinistra
const rg=(c)=>{const id='g'+(++gid);return{id,def:`<radialGradient id="${id}" cx="35%" cy="28%" r="80%"><stop offset="0" stop-color="${sh(c,1.35)}"/><stop offset=".55" stop-color="${c}"/><stop offset="1" stop-color="${sh(c,.62)}"/></radialGradient>`}};
const lg=(a,b)=>{const id='l'+(++gid);return{id,def:`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`}};
const shadow=(y=92,w=30)=>`<ellipse cx="50" cy="${y}" rx="${w}" ry="4.5" fill="#000" opacity=".28"/>`;
const shine=(x,y,rx,ry,rot=-30)=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fff" opacity=".45" transform="rotate(${rot} ${x} ${y})"/>`;
// occhio: r raggio, look = spostamento della pupilla, kind: n normale, h felice (arco). Per l'occhio assonnato si aggiunge lid()
function eye(x,y,r,kind='n',look=[0,0],pc='#1d0f2e'){
 if(kind==='h')return`<path d="M${x-r} ${y+r*.2} Q${x} ${y-r*1.1} ${x+r} ${y+r*.2}" fill="none" stroke="${OL}" stroke-width="${r*.45}" stroke-linecap="round"/>`;
 let s=`<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${OL}" stroke-width="${r*.22}"/><circle cx="${x+look[0]*r*.35}" cy="${y+look[1]*r*.35}" r="${r*.58}" fill="${pc}"/><circle cx="${x+look[0]*r*.35-r*.2}" cy="${y+look[1]*r*.35-r*.22}" r="${r*.22}" fill="#fff"/>`;
 return s}
// palpebra assonnata colorata come il corpo
const lid=(x,y,r,c)=>`<path d="M${x-r*1.15} ${y+r*.05} A${r*1.15} ${r*1.15} 0 0 1 ${x+r*1.15} ${y+r*.05} Z" fill="${c}" stroke="${OL}" stroke-width="${r*.22}"/>`;
const brow=(x,y,w,ang)=>`<path d="M${x-w} ${y} L${x+w} ${y}" stroke="${OL}" stroke-width="2.6" stroke-linecap="round" transform="rotate(${ang} ${x} ${y})"/>`;
const smile=(x,y,w,d=5)=>`<path d="M${x-w} ${y} Q${x} ${y+d} ${x+w} ${y}" fill="none" stroke="${OL}" stroke-width="2.4" stroke-linecap="round"/>`;
const mouthO=(x,y,w,h,tongue=true)=>`<path d="M${x-w} ${y} Q${x} ${y+h*2} ${x+w} ${y} Z" fill="#5a1530" stroke="${OL}" stroke-width="2"/>`+(tongue?`<path d="M${x-w*.5} ${y+h*.85} Q${x} ${y+h*.45} ${x+w*.5} ${y+h*.85} Q${x} ${y+h*1.25} ${x-w*.5} ${y+h*.85}Z" fill="#ff6f8f"/>`:'');
const fang=(x,y,s=3)=>`<path d="M${x-s*.6} ${y} L${x} ${y+s*1.4} L${x+s*.6} ${y}Z" fill="#fff" stroke="${OL}" stroke-width="1"/>`;
const cheek=(x,y,r=3.4)=>`<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r*.62}" fill="#ff6f9a" opacity=".55"/>`;
const star=(x,y,r,c='#ffe36b',o=1)=>{let p='';for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;p+=(i?'L':'M')+(x+rr*Math.cos(a)).toFixed(1)+' '+(y+rr*Math.sin(a)).toFixed(1)}return`<path d="${p}Z" fill="${c}" opacity="${o}"/>`};
const sparkle=(x,y,r,c='#fff')=>`<path d="M${x} ${y-r} Q${x+r*.18} ${y-r*.18} ${x+r} ${y} Q${x+r*.18} ${y+r*.18} ${x} ${y+r} Q${x-r*.18} ${y+r*.18} ${x-r} ${y} Q${x-r*.18} ${y-r*.18} ${x} ${y-r}Z" fill="${c}"/>`;
const ol=(w=3)=>`stroke="${OL}" stroke-width="${w}" stroke-linejoin="round"`;

const M=[
// 1 Uovo sospetto: uovo maculato con una crepa da cui spiano due occhietti
()=>{const g=rg('#f4dcb0');return[g.def,`${shadow(91,24)}<path d="M50 10 C72 10 82 44 82 62 C82 80 68 90 50 90 C32 90 18 80 18 62 C18 44 28 10 50 10Z" fill="url(#${g.id})" ${ol()}/>
<ellipse cx="34" cy="60" rx="5" ry="4" fill="#c99a5b" opacity=".7"/><ellipse cx="64" cy="72" rx="6.5" ry="4.5" fill="#c99a5b" opacity=".7"/><ellipse cx="60" cy="30" rx="4" ry="3" fill="#c99a5b" opacity=".7"/>
<path d="M30 46 L38 41 L44 47 L51 40 L58 47 L64 42 L71 47" fill="none" stroke="${OL}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>
<path d="M36 47 L44 52 L51 46 L58 52 L65 47 L58 50 L51 44 L44 50Z" fill="#2b1640"/><circle cx="44" cy="48.6" r="1.9" fill="#ffe36b"/><circle cx="57" cy="48.6" r="1.9" fill="#ffe36b"/>${shine(36,26,8,4)}`]},
// 2 Gary il germe: palla verde con ciglia, sopracciglio sicuro di sé e sorrisetto
()=>{const g=rg('#7ad957');let c='';for(let i=0;i<14;i++){const a=i/14*Math.PI*2,x=50+35*Math.cos(a),y=54+33*Math.sin(a);c+=`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="#5fbf3d" ${ol(2.4)}/>`}
 return[g.def,`${shadow(92,26)}${c}<circle cx="50" cy="54" r="32" fill="url(#${g.id})" ${ol()}/>
<circle cx="34" cy="68" r="4" fill="#4aa52c" opacity=".6"/><circle cx="66" cy="40" r="3" fill="#4aa52c" opacity=".6"/>
${eye(40,50,7.5,'n',[.6,0])}${eye(60,50,7.5,'n',[.6,0])}${brow(60,39,6,-14)}${brow(40,40,6,6)}
<path d="M40 64 Q52 72 62 62" fill="none" stroke="${OL}" stroke-width="2.6" stroke-linecap="round"/>${cheek(33,61)}${cheek(68,60)}${shine(38,34,7,3.5)}`]},
// 3 Bruco pigro: segmenti verdi, testa con cappellino da notte e occhi assonnati
()=>{const g=rg('#9be35a'),h=rg('#b6f06e');let s='';[[22,66,13],[38,64,14],[54,62,15]].forEach(([x,y,r])=>{s+=`<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${g.id})" ${ol()}/><path d="M${x-4} ${y+r-2} l0 5 M${x+4} ${y+r-2} l0 5" stroke="${OL}" stroke-width="3" stroke-linecap="round"/>`});
 return[g.def+h.def,`${shadow(88,36)}${s}<circle cx="70" cy="52" r="20" fill="url(#${h.id})" ${ol()}/>
<path d="M58 36 Q70 12 92 28 Q80 30 82 40Z" fill="#6f7cf0" ${ol(2.4)}/><circle cx="93" cy="27" r="4.5" fill="#fff" ${ol(2)}/>
${eye(63,52,6)}${lid(63,52,6,'#b6f06e')}${eye(78,52,6)}${lid(78,52,6,'#b6f06e')}${smile(71,63,5,3)}${cheek(60,61,3)}${cheek(83,60,3)}
<text x="84" y="16" font-size="9" font-weight="900" fill="#c9d4ff" font-family="system-ui">z</text>${shine(64,40,6,3)}`]},
// 4 Ragno tessitore: corpo viola, otto zampe, quattro occhi, filo di ragnatela
()=>{const g=rg('#8a5ad8');let l='';for(let i=0;i<4;i++){const y=48+i*8,dx=26+i*2;l+=`<path d="M38 ${y} Q${50-dx-6} ${y-14} ${50-dx-10} ${y+12}" fill="none" ${ol(4)}/><path d="M62 ${y} Q${50+dx+6} ${y-14} ${50+dx+10} ${y+12}" fill="none" ${ol(4)}/>`}
 return[g.def,`<path d="M50 0 L50 24" stroke="#e6dcff" stroke-width="1.6"/>${shadow(92,26)}${l}<ellipse cx="50" cy="58" rx="24" ry="26" fill="url(#${g.id})" ${ol()}/>
${eye(40,54,7)}${eye(60,54,7)}${eye(45,42,4)}${eye(55,42,4)}${smile(50,68,6,4)}${fang(46,69,2.4)}${fang(54,69,2.4)}${cheek(34,66,3)}${cheek(66,66,3)}${shine(40,40,6,3)}`]},
// 5 Pipistrello notturno: ali spiegate, orecchie a punta, mascherina per dormire sulla fronte
()=>{const g=rg('#4c5ad6'),w=rg('#363f9e');return[g.def+w.def,`${shadow(90,22)}
<path d="M38 50 C24 30 8 34 4 46 C12 46 14 54 10 60 C18 56 24 62 24 68 C30 60 36 62 40 64Z" fill="url(#${w.id})" ${ol()}/>
<path d="M62 50 C76 30 92 34 96 46 C88 46 86 54 90 60 C82 56 76 62 76 68 C70 60 64 62 60 64Z" fill="url(#${w.id})" ${ol()}/>
<path d="M33 40 L30 18 L44 32Z M67 40 L70 18 L56 32Z" fill="#4c5ad6" ${ol()}/>
<ellipse cx="50" cy="56" rx="21" ry="24" fill="url(#${g.id})" ${ol()}/><path d="M32 40 Q50 32 68 40 L66 46 Q50 40 34 46Z" fill="#ff7ab0" ${ol(2)}/>
${eye(42,54,6.5,'n',[0,.4])}${eye(58,54,6.5,'n',[0,.4])}${smile(50,66,5,3)}${fang(46.5,67,2.2)}${fang(53.5,67,2.2)}${cheek(36,63,3)}${cheek(64,63,3)}${shine(42,42,5,2.5)}`]},
// 6 Rospo canterino: bocca aperta che canta, note musicali, papillon
()=>{const g=rg('#5ccf6f');return[g.def,`${shadow(92,30)}<ellipse cx="50" cy="62" rx="36" ry="28" fill="url(#${g.id})" ${ol()}/>
<circle cx="34" cy="38" r="12" fill="url(#${g.id})" ${ol()}/><circle cx="66" cy="38" r="12" fill="url(#${g.id})" ${ol()}/>
${eye(34,38,7,'h')}${eye(66,38,7,'h')}${mouthO(50,58,16,9)}
<path d="M40 82 L50 77 L60 82 L60 72 L50 77 L40 72Z" fill="#ff5c7a" ${ol(2)}/>${cheek(24,58,4)}${cheek(76,58,4)}
<path d="M84 18 L84 32" stroke="#fff" stroke-width="2.4"/><ellipse cx="81" cy="33" rx="4" ry="3" fill="#fff"/><path d="M84 18 L91 21" stroke="#fff" stroke-width="2.4"/>${shine(32,30,5,2.5)}${shine(40,50,8,3.5)}`]},
// 7 Lupo mannaro part-time: testa pelosa, orecchie, muso, cravatta da contabile e occhiali
()=>{const g=rg('#9a7b62'),m=rg('#d9bfa0');return[g.def+m.def,`${shadow(92,26)}
<path d="M28 40 L22 10 L42 28Z M72 40 L78 10 L58 28Z" fill="url(#${g.id})" ${ol()}/><path d="M29 32 L26 17 L37 28Z M71 32 L74 17 L63 28Z" fill="#f2a6b8"/>
<path d="M50 20 C74 20 84 40 82 58 L88 62 L80 66 C76 80 64 88 50 88 C36 88 24 80 20 66 L12 62 L18 58 C16 40 26 20 50 20Z" fill="url(#${g.id})" ${ol()}/>
<ellipse cx="50" cy="66" rx="16" ry="12" fill="url(#${m.id})" ${ol(2.4)}/><ellipse cx="50" cy="59" rx="5" ry="3.5" fill="${OL}"/>
${eye(39,47,6)}${eye(61,47,6)}<circle cx="39" cy="47" r="8.5" fill="none" stroke="#e8e8ff" stroke-width="2"/><circle cx="61" cy="47" r="8.5" fill="none" stroke="#e8e8ff" stroke-width="2"/><path d="M47 47 L53 47" stroke="#e8e8ff" stroke-width="2"/>
${smile(50,69,6,4)}${fang(45,70,2.2)}${fang(55,70,2.2)}<path d="M46 86 L50 82 L54 86 L52 98 L48 98Z" fill="#3a6fd8" ${ol(1.8)}/>${shine(38,30,7,3)}`]},
// 8 Zombie vegetariano: verde, cuciture, un occhio storto e un germoglio in testa
()=>{const g=rg('#8fc96b');return[g.def,`${shadow(92,26)}<path d="M50 14 Q53 4 60 6 Q58 13 52 14Z M50 14 Q45 3 37 6 Q41 13 50 14Z" fill="#5cd65a" ${ol(2)}/><path d="M50 14 L50 22" stroke="${OL}" stroke-width="2.4"/>
<rect x="22" y="22" width="56" height="64" rx="24" fill="url(#${g.id})" ${ol()}/>
<path d="M30 36 L44 30 M32 31 L34 37 M38 29 L40 35" stroke="${OL}" stroke-width="2" stroke-linecap="round"/>
${eye(40,50,7.5,'n',[-.4,.3])}${eye(61,52,5.5,'n',[.5,.5])}<path d="M37 70 Q50 64 63 70" fill="none" stroke="${OL}" stroke-width="2.4"/><path d="M42 67 L42 72 M48 66 L48 71 M54 66 L54 71 M59 67 L59 72" stroke="${OL}" stroke-width="1.6"/>
${cheek(30,62,3.2)}${cheek(70,62,3.2)}<circle cx="68" cy="78" r="2.5" fill="#5b8f3c"/>${shine(34,32,6,3)}`]},
// 9 Conte Succhiacaffè: pallido, capelli a punta, mantello rosso, canini e tazzina di espresso
()=>{const g=rg('#d9cdf2'),c=rg('#d8344a');return[g.def+c.def,`${shadow(93,28)}
<path d="M14 92 L22 48 L36 62 L50 56 L64 62 L78 48 L86 92Z" fill="url(#${c.id})" ${ol()}/>
<ellipse cx="50" cy="48" rx="24" ry="27" fill="url(#${g.id})" ${ol()}/><path d="M26 42 Q28 18 50 18 Q72 18 74 42 Q64 30 50 36 Q36 30 26 42Z" fill="#2b2140" ${ol(2.4)}/>
${eye(41,48,6,'n',[0,.2],'#c0182c')}${eye(59,48,6,'n',[0,.2],'#c0182c')}${brow(41,39,5,10)}${brow(59,39,5,-10)}
${smile(50,61,7,3)}${fang(45,62,2.6)}${fang(55,62,2.6)}
<path d="M70 70 L84 70 L82 84 L72 84Z" fill="#fff" ${ol(2.2)}/><path d="M84 73 Q90 75 83 80" fill="none" ${ol(2)}/><ellipse cx="77" cy="71" rx="6" ry="1.6" fill="#6b3a1a"/>
<path d="M74 66 Q72 62 75 59 M79 66 Q77 62 80 59" stroke="#fff" stroke-width="1.5" fill="none" opacity=".8"/>${shine(40,32,7,3)}`]},
// 10 Fantasma timido: lenzuolo con fondo ondulato, guance rosse, sguardo di lato
()=>{const g=rg('#f3f0ff');return[g.def,`${shadow(94,22)}<path d="M22 50 C22 24 36 12 50 12 C64 12 78 24 78 50 L78 86 Q72 80 66 86 Q60 92 56 86 Q50 80 44 86 Q40 92 34 86 Q28 80 22 86Z" fill="url(#${g.id})" ${ol()}/>
${eye(42,46,6,'n',[-.7,.4])}${eye(60,46,6,'n',[-.7,.4])}<path d="M46 60 Q50 57 54 60" fill="none" stroke="${OL}" stroke-width="2.2" stroke-linecap="round"/>${cheek(35,56,4.2)}${cheek(66,56,4.2)}
${shine(38,26,8,4)}`]},
// 11 Scheletro ginnasta: teschio con fascia sportiva, sorriso con i denti
()=>{const g=rg('#f5f1e6');return[g.def,`${shadow(92,22)}<path d="M50 14 C72 14 82 30 82 48 C82 60 76 66 70 68 L68 82 L32 82 L30 68 C24 66 18 60 18 48 C18 30 28 14 50 14Z" fill="url(#${g.id})" ${ol()}/>
<path d="M20 34 Q50 24 80 34 L79 42 Q50 32 21 42Z" fill="#ff4f7a" ${ol(2.2)}/><path d="M80 36 L92 32 L90 40Z" fill="#ff4f7a" ${ol(2)}/>
<ellipse cx="38" cy="52" rx="8" ry="9" fill="${OL}"/><ellipse cx="62" cy="52" rx="8" ry="9" fill="${OL}"/><circle cx="36" cy="49" r="2.4" fill="#fff"/><circle cx="60" cy="49" r="2.4" fill="#fff"/>
<path d="M47 64 L50 59 L53 64Z" fill="${OL}"/><path d="M36 70 L64 70" stroke="${OL}" stroke-width="2.4"/>
<path d="M40 70 L40 78 M46 70 L46 79 M52 70 L52 79 M58 70 L58 78" stroke="${OL}" stroke-width="2"/>${shine(36,26,7,3)}`]},
// 12 Orco d'ufficio: grosso, zanne, sopracciglia arrabbiate, cravatta
()=>{const g=rg('#8aa84a');return[g.def,`${shadow(93,32)}<path d="M50 16 C78 16 90 36 88 58 C86 80 70 90 50 90 C30 90 14 80 12 58 C10 36 22 16 50 16Z" fill="url(#${g.id})" ${ol()}/>
<path d="M12 46 L4 42 L10 54Z M88 46 L96 42 L90 54Z" fill="#8aa84a" ${ol(2.4)}/>
${eye(36,46,7,'n',[0,.3])}${eye(64,46,7,'n',[0,.3])}${brow(36,35,8,16)}${brow(64,35,8,-16)}
<path d="M30 66 Q50 58 70 66 Q50 72 30 66Z" fill="#5a1530" ${ol(2.4)}/><path d="M34 66 L32 56 L40 64Z M66 66 L68 56 L60 64Z" fill="#fff" ${ol(1.8)}/>
<path d="M44 86 L50 80 L56 86 L53 100 L47 100Z" fill="#d8344a" ${ol(1.8)}/>${shine(36,26,9,4)}`]},
// 13 Drago pasticciere: cappello da cuoco, ali piccole, sbuffo di fuoco gentile
()=>{const g=rg('#ff7a4a'),b=rg('#ffd38a');return[g.def+b.def,`${shadow(92,28)}
<path d="M20 56 L4 40 L14 62Z M80 56 L96 40 L86 62Z" fill="#ff9a6a" ${ol(2.4)}/>
<ellipse cx="50" cy="62" rx="30" ry="27" fill="url(#${g.id})" ${ol()}/><ellipse cx="50" cy="70" rx="17" ry="14" fill="url(#${b.id})" ${ol(2)}/>
<path d="M30 30 Q24 14 38 16 Q42 4 52 10 Q64 4 66 16 Q78 16 70 30Z" fill="#fff" ${ol(2.4)}/><rect x="31" y="28" width="38" height="9" rx="3" fill="#fff" ${ol(2.4)}/>
${eye(40,52,6.5,'h')}${eye(60,52,6.5,'h')}${smile(50,64,7,4)}${cheek(32,62,3.6)}${cheek(68,62,3.6)}
<path d="M80 72 Q92 66 96 74 Q90 74 92 80 Q86 76 80 78Z" fill="#ffb52e" stroke="#ff6a2e" stroke-width="1.6"/>${shine(38,48,7,3)}`]},
// --- Mondo 2: spazio ---
// 14 Luna oscura: sfera scura con crateri e occhi dorati luminosi
()=>{const g=rg('#5a3d8a');return[g.def,`${shadow(92,26)}<circle cx="50" cy="50" r="38" fill="#7a4cff" opacity=".25"/><circle cx="50" cy="52" r="32" fill="url(#${g.id})" ${ol()}/>
<circle cx="34" cy="36" r="5" fill="#3e2a63" ${ol(1.4)}/><circle cx="66" cy="70" r="7" fill="#3e2a63" ${ol(1.4)}/><circle cx="68" cy="34" r="3" fill="#3e2a63"/>
<ellipse cx="40" cy="54" rx="6" ry="4" fill="#ffd94a"/><ellipse cx="60" cy="54" rx="6" ry="4" fill="#ffd94a"/><ellipse cx="40" cy="54" rx="2" ry="3" fill="${OL}"/><ellipse cx="60" cy="54" rx="2" ry="3" fill="${OL}"/>
${smile(50,66,5,3)}${sparkle(14,18,4)}${sparkle(88,22,3)}${sparkle(84,84,3.5)}${shine(38,34,8,4)}`]},
// 15 Roccia filosofa: sasso con occhiali tondi, sopracciglio pensieroso
()=>{const g=rg('#9d97a8');return[g.def,`${shadow(92,32)}<path d="M18 80 L14 54 L26 30 L48 20 L72 24 L86 44 L88 72 L76 88 L30 90Z" fill="url(#${g.id})" ${ol()}/>
<path d="M30 40 L40 34 M70 70 L62 76 M26 66 L32 70" stroke="#6e6878" stroke-width="2"/>
${eye(40,52,6,'n',[.5,-.4])}${eye(62,52,6,'n',[.5,-.4])}<circle cx="40" cy="52" r="9" fill="none" stroke="${OL}" stroke-width="2.4"/><circle cx="62" cy="52" r="9" fill="none" stroke="${OL}" stroke-width="2.4"/><path d="M49 52 L53 52" stroke="${OL}" stroke-width="2.4"/>
${brow(62,39,6,-12)}<path d="M44 70 L56 70" stroke="${OL}" stroke-width="2.4" stroke-linecap="round"/>${shine(38,32,8,3)}`]},
// 16 Cometa ritardataria: testa luminosa con coda di fuoco e orologio
()=>{const g=rg('#8fd8ff'),t=lg('#fff4b0','#ff7a2e');return[g.def+t.def,`
<path d="M44 40 Q20 30 2 16 Q14 40 4 52 Q20 52 8 74 Q28 64 46 66Z" fill="url(#${t.id})" opacity=".95"/>
${shadow(92,20)}<circle cx="58" cy="52" r="24" fill="url(#${g.id})" ${ol()}/>
${eye(52,50,6,'n',[.6,0])}${eye(68,50,6,'n',[.6,0])}${brow(52,40,5,8)}${brow(68,40,5,-8)}<path d="M54 64 Q61 60 68 64" fill="none" stroke="${OL}" stroke-width="2.4" stroke-linecap="round"/>
<circle cx="82" cy="74" r="9" fill="#fff" ${ol(2.4)}/><path d="M82 68 L82 74 L86 76" stroke="${OL}" stroke-width="2" fill="none" stroke-linecap="round"/>${shine(52,38,6,3)}`]},
// 17 Falce insonne: luna crescente con occhiaie e cappellino da notte
()=>{const g=rg('#ffe07a');return[g.def,`${shadow(92,20)}<path d="M58 10 C30 14 18 40 24 62 C30 84 56 94 76 84 C58 82 44 66 44 48 C44 30 52 16 58 10Z" fill="url(#${g.id})" ${ol()}/>
${eye(40,48,6,'n',[.5,0])}${lid(40,48,6,'#ffe07a')}<path d="M33 56 Q40 60 46 56" stroke="#a682e8" stroke-width="2" fill="none"/><path d="M36 70 Q42 68 46 72" stroke="${OL}" stroke-width="2.4" fill="none" stroke-linecap="round"/>
<path d="M48 14 Q62 0 82 10 Q70 12 70 22Z" fill="#6f7cf0" ${ol(2.4)}/><circle cx="83" cy="10" r="4" fill="#fff" ${ol(1.8)}/>
${sparkle(80,40,4)}${sparkle(88,60,3)}${shine(34,30,6,3)}`]},
// 18 Pianeta hula-hoop: pianeta arancione con anello inclinato, felice
()=>{const g=rg('#ff9a4a');return[g.def,`${shadow(92,26)}<ellipse cx="50" cy="56" rx="44" ry="12" fill="none" stroke="#ff5ca8" stroke-width="5" transform="rotate(-14 50 56)"/>
<circle cx="50" cy="50" r="28" fill="url(#${g.id})" ${ol()}/><path d="M24 44 Q50 38 76 44 M24 58 Q50 54 76 60" stroke="#e8742a" stroke-width="3" fill="none"/>
${eye(41,48,6,'h')}${eye(59,48,6,'h')}${mouthO(50,58,7,4)}${cheek(33,56,3.4)}${cheek(67,56,3.4)}
<path d="M8 66 A44 12 -14 0 0 92 44" fill="none" stroke="#ff5ca8" stroke-width="5" transform="rotate(0)"/><path d="M8 66 A44 12 -14 0 0 92 44" fill="none" stroke="${OL}" stroke-width="1.2" opacity=".5"/>${shine(40,32,8,3.5)}`]},
// 19 Disco turista: UFO con cupola di vetro, occhi dentro, luci e macchina fotografica
()=>{const g=rg('#b9c3d6'),d=rg('#9ff0ff');return[g.def+d.def,`${shadow(92,30)}<path d="M38 72 L30 90 L70 90 L62 72Z" fill="#9ff0ff" opacity=".25"/>
<ellipse cx="50" cy="42" rx="20" ry="18" fill="url(#${d.id})" ${ol()}/>${eye(43,40,5)}${eye(57,40,5)}${smile(50,49,4,2.5)}
<ellipse cx="50" cy="58" rx="42" ry="14" fill="url(#${g.id})" ${ol()}/><ellipse cx="50" cy="54" rx="30" ry="5" fill="#fff" opacity=".35"/>
<circle cx="24" cy="62" r="3.2" fill="#ffe36b"/><circle cx="40" cy="66" r="3.2" fill="#ff6f9a"/><circle cx="60" cy="66" r="3.2" fill="#7affb0"/><circle cx="76" cy="62" r="3.2" fill="#ffe36b"/>
<rect x="66" y="22" width="16" height="11" rx="2.5" fill="#3a3550" ${ol(1.8)}/><circle cx="74" cy="27.5" r="3.4" fill="#9ff0ff" ${ol(1.4)}/>${shine(44,32,6,3)}`]},
// 20 Alieno ambasciatore: testa verde con occhioni, antenne e papillon
()=>{const g=rg('#7be06b');return[g.def,`${shadow(92,22)}<path d="M36 24 Q30 8 24 8 M64 24 Q70 8 76 8" stroke="${OL}" stroke-width="2.6" fill="none"/><circle cx="24" cy="8" r="4.5" fill="#ffe36b" ${ol(2)}/><circle cx="76" cy="8" r="4.5" fill="#ffe36b" ${ol(2)}/>
<path d="M50 18 C76 18 84 40 78 58 C72 76 60 84 50 84 C40 84 28 76 22 58 C16 40 24 18 50 18Z" fill="url(#${g.id})" ${ol()}/>
<ellipse cx="38" cy="50" rx="10" ry="13" fill="${OL}" transform="rotate(-18 38 50)"/><ellipse cx="62" cy="50" rx="10" ry="13" fill="${OL}" transform="rotate(18 62 50)"/><circle cx="35" cy="45" r="3.4" fill="#fff"/><circle cx="59" cy="45" r="3.4" fill="#fff"/>
${smile(50,70,5,3)}<path d="M38 88 L50 83 L62 88 L62 96 L50 91 L38 96Z" fill="#ff4f7a" ${ol(2)}/>${shine(38,28,8,3)}`]},
// 21 Aragosta astronauta: rossa con chele e casco di vetro
()=>{const g=rg('#ff5a4a');return[g.def,`${shadow(92,30)}
<path d="M22 60 Q6 50 10 34 Q18 40 22 36 Q20 46 28 50Z M78 60 Q94 50 90 34 Q82 40 78 36 Q80 46 72 50Z" fill="url(#${g.id})" ${ol(2.6)}/>
<ellipse cx="50" cy="66" rx="24" ry="22" fill="url(#${g.id})" ${ol()}/><path d="M30 70 Q50 76 70 70 M32 80 Q50 86 68 80" stroke="#c23a2e" stroke-width="2.4" fill="none"/>
<circle cx="50" cy="42" r="24" fill="#bff6ff" opacity=".35" ${ol(2.6)}/><circle cx="50" cy="46" r="15" fill="url(#${g.id})" ${ol(2.4)}/>
${eye(44,44,5)}${eye(56,44,5)}${smile(50,53,4,2.5)}<path d="M42 32 Q38 22 32 20 M58 32 Q62 22 68 20" stroke="${OL}" stroke-width="2" fill="none"/>
<path d="M34 28 Q42 22 52 24" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".8"/>`]},
// 22 Polpo cosmico: viola a pois-stella con otto tentacoli arricciati
()=>{const g=rg('#b05ad8');let t='';for(let i=0;i<8;i++){const x=16+i*9.7,d=i%2?1:-1;t+=`<path d="M${x+4} 66 Q${x} 80 ${x+6*d} 86 Q${x+10*d} 90 ${x+8*d} 94" fill="none" stroke="url(#${g.id})" stroke-width="7" stroke-linecap="round"/><path d="M${x+4} 66 Q${x} 80 ${x+6*d} 86 Q${x+10*d} 90 ${x+8*d} 94" fill="none" stroke="${OL}" stroke-width="1.2" opacity=".5"/>`}
 return[g.def,`${shadow(94,32)}${t}<path d="M50 14 C76 14 84 36 84 52 C84 66 72 72 50 72 C28 72 16 66 16 52 C16 36 24 14 50 14Z" fill="url(#${g.id})" ${ol()}/>
${star(30,32,4,'#ffe7ff',.8)}${star(70,28,3.4,'#ffe7ff',.8)}${star(74,56,3,'#ffe7ff',.8)}
${eye(40,46,7,'n',[0,.3])}${eye(60,46,7,'n',[0,.3])}${smile(50,58,5,3)}${cheek(30,54,3.4)}${cheek(70,54,3.4)}${shine(36,26,8,3.5)}`]},
// 23 Balena stellare: balena blu con stelle e soffio di stelline
()=>{const g=rg('#4a8af0'),b=rg('#bfe4ff');return[g.def+b.def,`${shadow(92,34)}
<path d="M84 56 Q96 40 98 50 Q92 56 98 66 Q90 66 84 62Z" fill="url(#${g.id})" ${ol(2.6)}/>
<path d="M12 60 C12 38 30 30 52 30 C74 30 88 44 86 60 C84 76 66 84 46 84 C26 84 12 76 12 60Z" fill="url(#${g.id})" ${ol()}/>
<path d="M18 66 Q46 86 80 66 Q66 82 46 82 Q28 82 18 66Z" fill="url(#${b.id})"/>
${eye(34,54,6,'h')}${smile(42,64,6,3)}${cheek(26,62,3.4)}${star(56,44,3,'#fff',.85)}${star(70,52,2.4,'#fff',.85)}${star(62,60,2,'#fff',.85)}
<path d="M42 30 Q40 18 34 14 M42 30 Q44 18 50 12" stroke="#bfe4ff" stroke-width="2.4" fill="none"/>${sparkle(32,12,4,'#fff')}${sparkle(52,8,4,'#ffe36b')}${shine(30,40,8,3)}`]},
// 24 Vortice distratto: spirale con occhi a girandola
()=>{const g=rg('#5ad0d8');let p='M50 52';for(let a=0;a<6*Math.PI;a+=.25){const r=2+a*2.1;p+=` L${(50+r*Math.cos(a)).toFixed(1)} ${(52+r*Math.sin(a)).toFixed(1)}`}
 return[g.def,`${shadow(92,26)}<circle cx="50" cy="52" r="38" fill="url(#${g.id})" ${ol()}/><path d="${p}" fill="none" stroke="#2f8ea0" stroke-width="3.5" opacity=".55"/>
<circle cx="40" cy="48" r="7" fill="#fff" ${ol(1.8)}/><circle cx="60" cy="48" r="7" fill="#fff" ${ol(1.8)}/><path d="M40 48 m-4 0 a4 4 0 1 0 4 -4 a2.5 2.5 0 1 0 -2.5 2.5" fill="none" stroke="${OL}" stroke-width="1.8"/><path d="M60 48 m-4 0 a4 4 0 1 0 4 -4 a2.5 2.5 0 1 0 -2.5 2.5" fill="none" stroke="${OL}" stroke-width="1.8"/>
<path d="M44 64 Q47 61 50 64 Q53 67 56 64" fill="none" stroke="${OL}" stroke-width="2.4" stroke-linecap="round"/>${shine(36,30,8,3.5)}`]},
// 25 Galassia a spirale: bracci di stelle e una faccina al centro
()=>{const g=rg('#ff9ae6');let arms='';for(let k=0;k<3;k++){let p='';for(let a=0;a<4.2;a+=.2){const r=12+a*8,an=a+k*2.094;p+=(a?' L':'M')+(50+r*Math.cos(an)).toFixed(1)+' '+(52+r*.72*Math.sin(an)).toFixed(1)}arms+=`<path d="${p}" fill="none" stroke="#c89bff" stroke-width="7" stroke-linecap="round" opacity=".55"/>`}
 return[g.def,`<ellipse cx="50" cy="52" rx="46" ry="34" fill="#3b1c70" opacity=".5"/>${arms}${star(18,30,3)}${star(84,40,3.4)}${star(24,74,2.6)}${star(78,78,3)}${star(60,16,2.4)}
<circle cx="50" cy="52" r="16" fill="url(#${g.id})" ${ol(2.6)}/>${eye(44,50,4.2,'h')}${eye(56,50,4.2,'h')}${smile(50,57,3.5,2.4)}${sparkle(50,52,22,'#fff3')}`]},
// 26 Stella cadente: stella sorridente con scia arcobaleno e occhiolino
()=>{const g=rg('#ffd84a');return[g.def,`
<path d="M44 58 Q22 70 4 92" stroke="#ff6f9a" stroke-width="7" stroke-linecap="round" fill="none" opacity=".85"/><path d="M42 52 Q20 62 2 82" stroke="#7affb0" stroke-width="7" stroke-linecap="round" fill="none" opacity=".85"/><path d="M40 46 Q18 54 2 72" stroke="#7ac8ff" stroke-width="7" stroke-linecap="round" fill="none" opacity=".85"/>
<path d="M62 8 L71 30 L95 32 L76 47 L82 71 L62 58 L42 71 L48 47 L29 32 L53 30Z" fill="url(#${g.id})" ${ol()}/>
${eye(55,40,5)}${eye(69,40,5,'h')}${smile(62,50,5,3.5)}${cheek(50,48,3)}${cheek(75,48,3)}${shine(58,24,5,2.5)}`]},
// --- Mondo 3: vulcano ---
// 27 Folletto di brace: fiammella a goccia con faccina
()=>{const g=lg('#fff1a0','#ff5a1e');return[g.def,`${shadow(92,18)}<path d="M50 6 C58 22 76 34 76 58 C76 76 64 88 50 88 C36 88 24 76 24 58 C24 44 34 36 38 24 C42 34 46 36 48 32 C46 22 48 14 50 6Z" fill="url(#${g.id})" ${ol()}/>
<path d="M50 40 C56 50 62 56 62 66 C62 76 56 80 50 80 C44 80 38 76 38 66 C38 58 46 52 50 40Z" fill="#fff3b0" opacity=".7"/>
${eye(42,60,5.5)}${eye(58,60,5.5)}${smile(50,70,5,3.5)}${cheek(36,68,3)}${cheek(64,68,3)}`]},
// 28 Lumaca di lava: corpo color sabbia e guscio di roccia con spirale incandescente
()=>{const g=rg('#e9c08a'),s=rg('#5a3a3a');let p='M66 50';for(let a=0;a<4.4*Math.PI;a+=.25){const r=2+a*1.55;p+=` L${(64+r*Math.cos(a)).toFixed(1)} ${(48+r*Math.sin(a)).toFixed(1)}`}
 return[g.def+s.def,`${shadow(92,34)}<path d="M8 84 Q14 66 30 62 L82 66 Q92 80 86 86Z" fill="url(#${g.id})" ${ol()}/><path d="M20 62 Q14 46 18 40 M30 62 Q30 46 34 40" stroke="${OL}" stroke-width="2.4" fill="none"/>
<circle cx="18" cy="38" r="4.5" fill="#fff" ${ol(1.8)}/><circle cx="34" cy="38" r="4.5" fill="#fff" ${ol(1.8)}/><circle cx="19" cy="38.5" r="2.4" fill="${OL}"/><circle cx="35" cy="38.5" r="2.4" fill="${OL}"/>
${smile(24,72,5,3)}<circle cx="64" cy="48" r="24" fill="url(#${s.id})" ${ol()}/><path d="${p}" fill="none" stroke="#ff8a1e" stroke-width="4" stroke-linecap="round"/><path d="${p}" fill="none" stroke="#ffe36b" stroke-width="1.5" stroke-linecap="round"/>`]},
// 29 Granchio di magma: corpo scuro con crepe incandescenti, chele e occhi sugli steli
()=>{const g=rg('#c2402e');return[g.def,`${shadow(92,34)}<path d="M22 70 L8 78 M24 76 L12 88 M78 70 L92 78 M76 76 L88 88" stroke="${OL}" stroke-width="4" stroke-linecap="round"/>
<path d="M24 50 Q6 44 8 26 Q16 32 22 26 Q18 40 30 44Z M76 50 Q94 44 92 26 Q84 32 78 26 Q82 40 70 44Z" fill="url(#${g.id})" ${ol(2.6)}/>
<ellipse cx="50" cy="62" rx="30" ry="20" fill="url(#${g.id})" ${ol()}/><path d="M30 60 L38 66 L44 58 L52 68 L60 60 L68 66" fill="none" stroke="#ffb21e" stroke-width="2.6" stroke-linejoin="round"/>
<path d="M40 44 L38 30 M60 44 L62 30" stroke="${OL}" stroke-width="3"/>${eye(38,28,6,'n',[0,.3])}${eye(62,28,6,'n',[0,.3])}${smile(50,72,6,3)}${shine(38,52,7,3)}`]},
// 30 Lampada lavica: lampada da laboratorio con bolle di lava e faccina sul vetro
()=>{const g=lg('#ff8a3a','#c2186a'),m=rg('#8a8fa8');return[g.def+m.def,`${shadow(94,20)}<path d="M38 8 L62 8 L60 16 L40 16Z" fill="url(#${m.id})" ${ol(2.4)}/>
<path d="M40 16 L60 16 Q74 46 66 78 L34 78 Q26 46 40 16Z" fill="url(#${g.id})" ${ol()}/><circle cx="46" cy="30" r="5" fill="#ffd34a" opacity=".85"/><circle cx="56" cy="40" r="3.5" fill="#ffd34a" opacity=".85"/><ellipse cx="50" cy="70" rx="12" ry="5" fill="#ffd34a" opacity=".8"/>
${eye(43,50,5)}${eye(57,50,5)}${smile(50,60,4.5,3)}<path d="M30 78 L70 78 L76 92 L24 92Z" fill="url(#${m.id})" ${ol()}/><path d="M42 20 Q38 40 40 64" stroke="#fff" stroke-width="2.4" fill="none" opacity=".55"/>`]},
// 31 Gatto di cenere: gatto grigio con orecchie che brillano di brace e sbuffo di fumo
()=>{const g=rg('#8d8796');return[g.def,`${shadow(92,26)}<path d="M26 40 L22 12 L44 28Z M74 40 L78 12 L56 28Z" fill="url(#${g.id})" ${ol()}/><path d="M26 32 L24 16 L36 27Z M74 32 L76 16 L64 27Z" fill="#ff8a1e"/>
<ellipse cx="50" cy="56" rx="32" ry="30" fill="url(#${g.id})" ${ol()}/>
<ellipse cx="38" cy="52" rx="6" ry="7" fill="#ffd34a" ${ol(2)}/><ellipse cx="62" cy="52" rx="6" ry="7" fill="#ffd34a" ${ol(2)}/><ellipse cx="38" cy="53" rx="1.8" ry="5" fill="${OL}"/><ellipse cx="62" cy="53" rx="1.8" ry="5" fill="${OL}"/>
<path d="M47 62 L53 62 L50 66Z" fill="#ff7a9a"/><path d="M50 66 Q46 70 42 68 M50 66 Q54 70 58 68" stroke="${OL}" stroke-width="2" fill="none"/><path d="M20 60 L32 62 M20 66 L32 65 M80 60 L68 62 M80 66 L68 65" stroke="${OL}" stroke-width="1.5"/>
<circle cx="80" cy="18" r="5" fill="#c9c4d4" opacity=".7"/><circle cx="88" cy="10" r="3.5" fill="#c9c4d4" opacity=".5"/>`]},
// 32 Salamandra fiammante: lucertola arancione a macchie gialle, coda arricciata
()=>{const g=rg('#ff7a2e');return[g.def,`${shadow(92,34)}<path d="M70 66 Q92 66 92 50 Q92 38 82 40 Q88 46 84 52 Q80 58 66 56Z" fill="url(#${g.id})" ${ol(2.6)}/>
<ellipse cx="50" cy="64" rx="26" ry="16" fill="url(#${g.id})" ${ol()}/><path d="M32 76 L28 88 M44 78 L42 90 M58 78 L60 90 M68 74 L72 86" stroke="${OL}" stroke-width="4" stroke-linecap="round"/>
<circle cx="30" cy="46" r="18" fill="url(#${g.id})" ${ol()}/>${eye(24,42,5.5)}${eye(38,42,5.5)}${smile(30,54,6,3)}
<circle cx="50" cy="60" r="3.5" fill="#ffe36b"/><circle cx="62" cy="68" r="3" fill="#ffe36b"/><circle cx="44" cy="70" r="2.6" fill="#ffe36b"/><path d="M22 30 Q30 20 38 30" stroke="#ffe36b" stroke-width="3" fill="none" stroke-linecap="round"/>`]},
// 33 Golem d'ossidiana: blocchi scuri con crepe arancioni e occhi incandescenti
()=>{const g=rg('#4a3a5e');return[g.def,`${shadow(93,34)}<path d="M8 50 L22 44 L26 72 L12 74Z M92 50 L78 44 L74 72 L88 74Z" fill="url(#${g.id})" ${ol()}/>
<path d="M26 22 L74 22 L82 50 L76 86 L24 86 L18 50Z" fill="url(#${g.id})" ${ol()}/><path d="M34 22 L40 40 L34 56 M70 30 L62 46 L68 64 M44 86 L50 70 L58 86" fill="none" stroke="#ff8a1e" stroke-width="2.6" stroke-linejoin="round"/>
<path d="M32 40 L44 44 L32 48Z M68 40 L56 44 L68 48Z" fill="#ffd34a"/><path d="M40 62 L60 62" stroke="#ffb21e" stroke-width="3" stroke-linecap="round"/>${shine(36,30,8,3)}`]},
// 34 Vulcano brontolone: montagna con cratere di lava, faccia imbronciata e fumo
()=>{const g=lg('#8a5a4a','#4a2c2a');return[g.def,`${shadow(94,40)}<circle cx="40" cy="14" r="7" fill="#b9b2c4" opacity=".7"/><circle cx="54" cy="8" r="9" fill="#b9b2c4" opacity=".6"/><circle cx="66" cy="16" r="6" fill="#b9b2c4" opacity=".6"/>
<path d="M8 90 L36 30 L64 30 L92 90Z" fill="url(#${g.id})" ${ol()}/><path d="M36 30 Q50 38 64 30 L60 44 L54 38 L50 50 L44 40 L40 46Z" fill="#ff6a1e" ${ol(2)}/>
${eye(40,64,6,'n',[0,.4])}${eye(60,64,6,'n',[0,.4])}${brow(40,54,7,16)}${brow(60,54,7,-16)}<path d="M42 80 Q50 74 58 80" fill="none" stroke="${OL}" stroke-width="2.6" stroke-linecap="round"/>`]},
// 35 Pulcino fenice: pulcino tondo con cresta di fiamma e alette
()=>{const g=rg('#ff8a3a');return[g.def,`${shadow(92,24)}<path d="M40 22 Q36 4 46 12 Q50 0 54 12 Q64 4 60 22Z" fill="#ffd34a" ${ol(2.4)}/>
<path d="M20 58 Q6 54 10 70 Q16 64 24 68Z M80 58 Q94 54 90 70 Q84 64 76 68Z" fill="#ff5a2e" ${ol(2.4)}/><circle cx="50" cy="56" r="32" fill="url(#${g.id})" ${ol()}/>
${eye(40,50,6.5)}${eye(60,50,6.5)}<path d="M44 60 L56 60 L50 70Z" fill="#ffd34a" ${ol(2)}/>${cheek(32,62,3.6)}${cheek(68,62,3.6)}<path d="M40 86 L36 94 M60 86 L64 94" stroke="${OL}" stroke-width="3" stroke-linecap="round"/>${shine(38,36,8,3.5)}`]},
// 36 Cavaliere fuso: elmo con visiera, occhi di fuoco e pennacchio di fiamma
()=>{const g=rg('#a3a9bd'),f=lg('#fff1a0','#ff4a1e');return[g.def+f.def,`${shadow(93,28)}<path d="M50 14 Q60 -2 74 6 Q64 8 66 18 Q60 12 54 20Z" fill="url(#${f.id})" ${ol(2)}/>
<path d="M22 50 C22 26 34 16 50 16 C66 16 78 26 78 50 L76 86 L24 86Z" fill="url(#${g.id})" ${ol()}/><path d="M50 18 L50 86" stroke="#7a7f94" stroke-width="2.4"/>
<rect x="26" y="44" width="48" height="12" rx="5" fill="${OL}"/><ellipse cx="39" cy="50" rx="6" ry="3" fill="#ff8a1e"/><ellipse cx="61" cy="50" rx="6" ry="3" fill="#ff8a1e"/>
<path d="M32 66 L68 66 M32 74 L68 74" stroke="#7a7f94" stroke-width="2.4"/>${shine(36,28,8,3.5)}`]},
// 37 Viverna di cenere: testa di drago rosso scuro con corna e brace negli occhi
()=>{const g=rg('#a8283a');return[g.def,`${shadow(93,30)}<path d="M28 34 Q14 14 26 6 Q26 20 38 26Z M72 34 Q86 14 74 6 Q74 20 62 26Z" fill="#e8d8b0" ${ol(2.4)}/>
<path d="M50 18 C74 18 86 34 84 54 C82 66 76 70 70 74 L74 84 Q50 92 26 84 L30 74 C24 70 18 66 16 54 C14 34 26 18 50 18Z" fill="url(#${g.id})" ${ol()}/>
<ellipse cx="38" cy="48" rx="7" ry="5" fill="#ffd34a" ${ol(2)}/><ellipse cx="62" cy="48" rx="7" ry="5" fill="#ffd34a" ${ol(2)}/><ellipse cx="38" cy="48" rx="2" ry="4" fill="${OL}"/><ellipse cx="62" cy="48" rx="2" ry="4" fill="${OL}"/>
${brow(38,40,7,14)}${brow(62,40,7,-14)}<circle cx="44" cy="64" r="2" fill="${OL}"/><circle cx="56" cy="64" r="2" fill="${OL}"/><path d="M34 74 Q50 82 66 74" fill="none" stroke="${OL}" stroke-width="2.4"/>${fang(40,75,2.6)}${fang(60,75,2.6)}
<circle cx="86" cy="58" r="3" fill="#b9b2c4" opacity=".7"/><circle cx="92" cy="50" r="4" fill="#b9b2c4" opacity=".5"/>${shine(36,30,8,3)}`]},
// 38 Titano solare: sole con raggi a punta e sguardo fiero
()=>{const g=rg('#ffcc3a');let r='';for(let i=0;i<12;i++){const a=i/12*Math.PI*2,x1=50+30*Math.cos(a),y1=52+30*Math.sin(a),x2=50+46*Math.cos(a+.13),y2=52+46*Math.sin(a+.13),x3=50+30*Math.cos(a+.26),y3=52+30*Math.sin(a+.26);r+=`<path d="M${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)} L${x3.toFixed(1)} ${y3.toFixed(1)}Z" fill="#ff9a1e" ${ol(2)}/>`}
 return[g.def,`${r}<circle cx="50" cy="52" r="32" fill="url(#${g.id})" ${ol()}/>${eye(40,48,6.5,'n',[0,.2])}${eye(60,48,6.5,'n',[0,.2])}${brow(40,38,7,10)}${brow(60,38,7,-10)}
<path d="M38 64 Q50 72 62 64" fill="none" stroke="${OL}" stroke-width="2.8" stroke-linecap="round"/>${cheek(30,60,3.6)}${cheek(70,60,3.6)}${shine(38,34,9,4)}`]},
// 39 Cuore del vulcano: cristallo-cuore incandescente con corona e scintille
()=>{const g=lg('#ffe36b','#ff3a5a'),c=lg('#fff6c8','#e8a01e');return[g.def+c.def,`<circle cx="50" cy="56" r="42" fill="#ff7a2e" opacity=".22"/>${shadow(94,24)}
<path d="M50 88 L16 52 C6 40 14 22 30 22 C40 22 46 28 50 36 C54 28 60 22 70 22 C86 22 94 40 84 52Z" fill="url(#${g.id})" ${ol()}/><path d="M50 36 L50 88 M26 30 L50 60 L74 30" stroke="#fff" stroke-width="1.6" opacity=".45" fill="none"/>
<path d="M32 22 L36 6 L44 16 L50 2 L56 16 L64 6 L68 22Z" fill="url(#${c.id})" ${ol(2.4)}/><circle cx="50" cy="12" r="2.6" fill="#ff5ca8"/>
${eye(40,52,5.5)}${eye(60,52,5.5)}${smile(50,62,6,4)}${sparkle(12,20,4.5,'#ffe36b')}${sparkle(90,16,4,'#ffe36b')}${sparkle(90,80,3.5,'#fff')}${sparkle(10,78,3.5,'#fff')}${shine(30,32,7,3)}`]},
];
const N=M.length;
function monSVG(t){const f=M[t-1];if(!f)return'';gid=0;const [defs,body]=f();
 return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs>${defs}</defs>${body}</svg>`}
export {monSVG,N as MON_N};

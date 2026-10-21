import {WS} from '../data/config.js';

function fmt(n,d){if(n<1000)return d&&n<10?n.toFixed(1):Math.floor(n)+'';if(!isFinite(n))return '∞';if(n>=1e36)return n.toExponential(2).replace('e+','e');const s=['K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc'];let i=-1;const n0=n;while(n>=1000&&i<s.length-1){n/=1000;i++}let r=n.toFixed(n<10?2:1);
 if(parseFloat(r)>=1000){if(i>=s.length-1)return n0.toExponential(2).replace('e+','e');n/=1000;i++;r=n.toFixed(n<10?2:1)} // 999.950 arrotonda a «1000.0K»: si passa al suffisso successivo
 return r+s[i]}
const hueOf=t=>t*27+(t>WS?140:0);
export {fmt,hueOf};

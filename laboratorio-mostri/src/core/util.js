import {WS} from '../data/config.js';

function fmt(n,d){if(n<1000)return d&&n<10?n.toFixed(1):Math.floor(n)+'';if(!isFinite(n))return '∞';if(n>=1e36)return n.toExponential(2).replace('e+','e');const s=['K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc'];let i=-1;while(n>=1000&&i<s.length-1){n/=1000;i++}return n.toFixed(n<10?2:1)+s[i]}
const hueOf=t=>t*27+(t>WS?140:0);
export {fmt,hueOf};

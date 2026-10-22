import {N,MAXT,NR} from '../data/config.js';

// Stato di gioco. S è un oggetto unico (mai riassegnato): setS lo svuota e lo riempie, così tutti i moduli
// che lo importano vedono sempre i dati aggiornati. R raccoglie le variabili di runtime condivise tra moduli.
const R={loaded:false,lang:'en',sel:-1,inited:false,pend:null,rs:0,colSel:0,ulq:[],ulT:0,shop:false,adPend:0,lastTap:0,adCd:0,adCl:0,wbInter:'',lastB:0,lastT:Date.now(),lastO:Date.now(),mallT:0,autoT:0,eggT:0,cmb:0,cmbT:0,expCh:-1,chSel:-1,gearSl:-1,twRes:null,ulInit:0,dlgShown:false,PZ:false,
 evT:25,evK:null,evX:0,evNew:0,evWb:0,offA:0,pO:0,pS:0,pB:0,pC:0,pE:0,pH:0,pO2:0,trC:0,tkT:0,chR:null,bell:-1,evEgg:0};
const def=()=>{const g=Array(N).fill(0);g[0]=1;g[1]=1;return{c:30,g,gv:Array(N).fill(0),sp:0,up:{l:0,d:0,o:0,a:0,c:0,f:0,m:0},am:0,ess:0,run:0,boost:0,st:1,bs:1,fm:0,ls:Date.now(),
 disc:[1,...Array(MAXT-1).fill(0)],col:Array(NR).fill(0),sfxOn:1,musOn:1,lp:'auto',pt:0,tut:0,
 dl:{d:-1,m:[],last:-1,st:0,dbl:1,lr:null,wk:-1,w:null,wl:[],mo:-1,ml:[],sh:1,cl:[],cl2:0,mon:0,hp:0},
 essT:0,lt:0,wd:1,tr:{},pk:{s:0,a:0,o:0,g:0,b:0,x:0,t:0,h:0,e:0,v:0,i:0},
 ach:{mg:0,sp:0,ev:0,pr:0,wn:0,ch:0,ab:0,ex:0,h:0,we:0,od:0},
 exp:{run:[]},inc:{r:[],h:0,nes:1,k:[0,1,2,3]},ord:{list:[],n:0,best:0,tier:1,miss:0,hot:0,nx:[]},ev:{wk:-1,el:0,p:0,tot:0,b:0,ok:0,x:0,m:null,got:0,cl:[],sp:{}},
 sq:[],an:{id:'',fs:0,d0:0,ss:0,ls:0,d:[],f:{}},introSeen:0,ch:null,ul:[],iap:{x2:0,na:0,st:0,got:[],os:0},amAd:0,mga:0,sad:{d:-1,n:0}}};
// ess = Essenze spendibili, essT = Essenze ottenute in totale (danno il +10% anche se spese)
// exp/inc/ord = timer a scopo di ritorno: restano attivi anche dopo l'Evocazione oscura (come le missioni giornaliere)
const KEEP=['ess','essT','st','bs','fm','disc','col','sfxOn','musOn','lp','pt','tut','dl','lt','wd','tr','pk','ach','an','exp','inc','ord','ev','introSeen','ch','ul','am','iap','sad','boost','amAd']; // boost e amAd: x2 e «Unione 5 minuti» guadagnati con un video restano anche dopo l'Evocazione oscura
const S={};
function setS(x){for(const k in S)delete S[k];Object.assign(S,x)}
setS(def());
export {S,R,setS,def,KEEP};

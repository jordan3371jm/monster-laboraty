// ---- Versione per YouTube Playables (npm run build:yt → dist-yt) ----
// YT è true solo in quel build (vite.config.js definisce __YT__). Lì YouTube vieta la Page Visibility API:
// pausa e ripresa arrivano solo da ytgame.system.onPause/onResume (R.PZ), quindi hidden() resta sempre false.
const YT=typeof __YT__!=='undefined'&&__YT__;
const hidden=()=>!YT&&document.hidden;
export {YT,hidden};

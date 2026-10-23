import { defineConfig } from 'vite';
import { rmSync } from 'node:fs';

// Build apribile anche con doppio clic (file://) e su Playgama:
// niente type="module" né crossorigin, che su file:// lasciano la pagina bianca.
const classic = () => ({
  name: 'classic-script',
  enforce: 'post',
  transformIndexHtml: (html) =>
    html.replace(/<!--DEV-ONLY-->[\s\S]*?<!--\/DEV-ONLY-->/g, '').replace(/<script type="module" crossorigin/g, '<script defer').replace(/ crossorigin/g, ''),
});

// YouTube Playables (npm run build:yt → dist-yt): l'SDK di YouTube al posto di Playgama Bridge, caricato prima di ogni altro script;
// niente navigator.language (la lingua la dà ytgame.system.getLanguage) e niente file di configurazione del Bridge.
const youtube = () => ({
  name: 'youtube-playables',
  enforce: 'post',
  transformIndexHtml: (html) =>
    html.replace(/<!-- Playgama Bridge[^\n]*\n<script src="https:\/\/bridge\.playgama\.com[^\n]*<\/script>\n?/, '')
      .replace('<meta charset="utf-8">', '<meta charset="utf-8">\n<script src="https://www.youtube.com/game_api/v1"></script>')
      .replace(/navigator\.language/g, "''"),
  closeBundle() { rmSync('dist-yt/playgama-bridge-config.json', { force: true }); },
});

export default defineConfig(({ mode }) => {
  const yt = mode === 'youtube';
  return {
    base: './',
    define: { __YT__: JSON.stringify(yt) },
    plugins: [classic(), ...(yt ? [youtube()] : [])],
    build: {
      outDir: yt ? 'dist-yt' : 'dist',
      emptyOutDir: true,
      rollupOptions: { output: { format: 'iife', inlineDynamicImports: true } },
    },
  };
});

import { defineConfig } from 'vite';

// Build apribile anche con doppio clic (file://) e su Playgama:
// niente type="module" né crossorigin, che su file:// lasciano la pagina bianca.
const classic = () => ({
  name: 'classic-script',
  enforce: 'post',
  transformIndexHtml: (html) =>
    html.replace(/<!--DEV-ONLY-->[\s\S]*?<!--\/DEV-ONLY-->/g, '').replace(/<script type="module" crossorigin/g, '<script defer').replace(/ crossorigin/g, ''),
});

export default defineConfig({
  base: './',
  plugins: [classic()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: { output: { format: 'iife', inlineDynamicImports: true } },
  },
});

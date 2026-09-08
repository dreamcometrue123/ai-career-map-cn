import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';

export default defineConfig({
  base: './',
  build: { rollupOptions: { input: { main: 'index.html', market: 'market.html' } } },
  plugins: [react()],
  css: { postcss: { plugins: [tailwindcss()] } },
});

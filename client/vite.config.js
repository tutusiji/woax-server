import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tailwindcss from 'tailwindcss';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@assets': path.resolve(__dirname, 'src/assets'),
    },
  },
  server: {
    port: 3000,
  },
  css: {
    postcss: {
      plugins: [tailwindcss],
    },
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@assets/styles/index.scss";`
      },
    },
  },
});
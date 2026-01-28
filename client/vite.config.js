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
    extensions: ['.js', '.jsx', '.json']
  },
  server: {
    port: 3600,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  },
  css: {
    postcss: {
      plugins: [tailwindcss],
    },
    preprocessorOptions: {
      scss: {
        // additionalData ：允许您在每个 Sass 文件的开头自动注入一些内容，比如变量、混合器或函数的导入语句
        // additionalData: `@import "./src/styles/variables.scss";`
      },
    },
  },
  build: {
    outDir: 'build'
  },
  esbuild: {
    loader: 'jsx',
    include: /\.(jsx|js)$/,
    exclude: []
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
        '.jsx': 'jsx'
      }
    }
  }
});
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, 'src') },
      { find: '@components', replacement: path.resolve(__dirname, 'src/components') },
      { find: '@lib', replacement: path.resolve(__dirname, 'src/lib') },
      { find: '@hooks', replacement: path.resolve(__dirname, 'src/hooks') },
      { find: '@contexts', replacement: path.resolve(__dirname, 'src/contexts') },
      { find: '@services', replacement: path.resolve(__dirname, 'src/services') },
      { find: '@types', replacement: path.resolve(__dirname, 'src/types') },
      { find: '@app', replacement: path.resolve(__dirname, 'src/app') },
    ],
  },
  server: {
    port: 5173,
    strictPort: true,
    open: true,
  },
  preview: {
    port: 5173,
    strictPort: true,
  },
  esbuild: {
    jsx: 'automatic',
  },
})

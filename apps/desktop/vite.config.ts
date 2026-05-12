import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, path.resolve(__dirname, '../..'), '');
  const appEnv = loadEnv(mode, process.cwd(), '');
  const env = { ...rootEnv, ...appEnv };

  return {
    base: './',
    plugins: [react()],
    define: {
      __API_URL__: JSON.stringify(env.VITE_API_URL || 'http://localhost:4000'),
    },
    server: {
      port: 5173,
      strictPort: true,
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
  };
});

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// In development the API calls go to the local Plexa DB Gateway (gateway/run.py).
const GATEWAY = process.env.PLEXA_GATEWAY_URL || 'http://127.0.0.1:8787';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': { target: GATEWAY, changeOrigin: true },
    },
  },
});

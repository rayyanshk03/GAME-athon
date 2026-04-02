import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Allows frontend to import engine logic directly from the backend folder
      // e.g. import { BADGES } from '@backend-engine/RewardsEngine'
      '@backend-engine': path.resolve(__dirname, '../backend/src/engine'),
    },
  },
  server: {
    port: 5173,
    fs: {
      // Allow Vite to serve files outside the frontend root (needed for @backend-engine alias)
      allow: ['..'],
    },
    proxy: {
      // ─── ONE PLACE TO CHANGE THE BACKEND URL ───────────────────
      // Change the `target` below to connect to your production backend.
      // e.g. target: 'https://your-api.onrender.com'
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});

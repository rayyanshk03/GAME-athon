import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Any /api/* request from the frontend is forwarded to the Express backend
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        // Remove /api prefix before forwarding — backend routes are /health, /store, /ai, /stocks
        // Uncomment the line below if your backend routes don't include /api prefix:
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});

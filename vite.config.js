import { defineConfig }  from 'vite';
import react             from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
  ],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    // Warn but don't fail — we have known large chunks (recharts, leaflet)
    chunkSizeWarningLimit: 800,
  },
});

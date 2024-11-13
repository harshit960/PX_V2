import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': process.env
  },
  server: {
    host: '0.0.0.0',  // Enables Vite to listen on all IPs, useful for Docker
    port: 3000,
    watch: {
      usePolling: true,  // Enables polling for file changes, useful in Docker environments
    },
  },
  build: {
    outDir: 'build', // Make sure this matches your build output location
  },
});

import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  },
  css: {
    // Bypass PostCSS entirely — Tailwind is pre-built via npm script
    postcss: { plugins: [] },
  },
  build: {
    // PERF-01: Vendor chunking to reduce main bundle size
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          'vendor-recharts': ['recharts'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});

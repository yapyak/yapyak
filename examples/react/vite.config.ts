import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { yapyak } from 'yapyak/vite';

export default defineConfig({
  plugins: [
    yapyak({
      persistence: 'cookie',
    }),
    react(),
  ],
});

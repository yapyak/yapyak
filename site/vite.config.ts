import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { defineConfig } from 'vite';
import { yapyak } from 'yapyak/vite';

export default defineConfig({
  css: {
    transformer: 'lightningcss',
  },
  plugins: [yapyak(), tanstackStart()],
  server: {
    port: 3000,
  },
});

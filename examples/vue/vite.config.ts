import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import { yapyak } from 'yapyak/vite';

export default defineConfig({
  plugins: [
    yapyak({
      persistence: 'cookie',
    }),
    vue(),
  ],
});

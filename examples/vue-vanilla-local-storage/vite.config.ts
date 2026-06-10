import vue from '@vitejs/plugin-vue';
import { yapyak } from '@yapyak/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    vue(),
    yapyak(),
  ],
});

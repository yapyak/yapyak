import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';
import { yapyak } from 'yapyak/vite';

export default defineConfig({
  plugins: [
    yapyak({
      cookie: 'locale',
      defaultLocale: 'en',
      framework: 'vue',
      locales: ['en', 'sv'],
    }),
    vue(),
  ],
});

import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { yapyak } from 'yapyak/vite';

export default defineConfig({
  plugins: [
    yapyak({
      cookie: 'locale',
      defaultLocale: 'en',
      framework: 'svelte',
      locales: ['en', 'sv'],
    }),
    svelte(),
  ],
});

import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import { yapyak } from 'yapyak/vite';

export default defineConfig({
  plugins: [
    yapyak({
      persistence: 'cookie',
      defaultLocale: 'en',
      framework: 'svelte',
      locales: ['en', 'sv'],
    }),
    svelte(),
  ],
});

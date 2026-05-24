import { svelte } from '@sveltejs/vite-plugin-svelte';
import { yapyak } from '@yapyak/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    yapyak({
      persistence: 'cookie',
    }),
    svelte(),
  ],
});

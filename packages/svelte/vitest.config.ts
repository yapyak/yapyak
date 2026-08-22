import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from '@yapyak/vitest-config';

export default defineConfig({
  environment: 'happy-dom',
  locales: [
    'en',
    'sv',
    'ar',
  ],
  plugins: [
    svelte(),
    svelteTesting(),
  ],
});

import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from '@yapyak/vitest-config';

export default defineConfig({
  environment: 'happy-dom',
  plugins: [svelte()],
});

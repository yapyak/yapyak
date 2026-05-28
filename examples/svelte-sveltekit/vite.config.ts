import { sveltekit } from '@sveltejs/kit/vite';
import { yapyak } from '@yapyak/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit(), yapyak()],
});

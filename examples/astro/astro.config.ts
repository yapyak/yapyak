import node from '@astrojs/node';
import { yapyak } from '@yapyak/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  adapter: node({ mode: 'standalone' }),
  output: 'server',
  vite: {
    plugins: [yapyak()],
  },
});

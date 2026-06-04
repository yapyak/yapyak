import node from '@astrojs/node';
import { yapyak } from '@yapyak/astro/integration';
import { defineConfig } from 'astro/config';

export default defineConfig({
  adapter: node({ mode: 'standalone' }),
  integrations: [yapyak()],
  output: 'server',
});

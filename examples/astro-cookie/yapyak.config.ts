import { astro } from '@yapyak/astro/processor';
import { defineConfig } from 'yapyak/config';

export default defineConfig({
  detectAcceptLanguage: true,
  persistence: 'cookie',
  processors: [astro()],
});

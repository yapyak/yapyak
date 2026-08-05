import { astro } from '@yapyak/astro/processor';
import { defineConfig } from 'yapyak/config';

export default defineConfig({
  detectUserLocale: true,
  persistence: 'url',
  processors: [
    astro(),
  ],
});

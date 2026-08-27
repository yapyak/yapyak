import { nuxt } from '@yapyak/nuxt/processor';
import { defineConfig } from 'yapyak/config';

export default defineConfig({
  persistence: 'cookie',
  processors: [
    nuxt(),
  ],
  syncHtmlAttributes: true,
});

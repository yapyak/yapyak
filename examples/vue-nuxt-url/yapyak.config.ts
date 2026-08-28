import { nuxt } from '@yapyak/nuxt/processor';
import { defineConfig } from 'yapyak/config';

export default defineConfig({
  persistence: 'url',
  processors: [
    nuxt(),
  ],
  syncHtmlAttributes: true,
});

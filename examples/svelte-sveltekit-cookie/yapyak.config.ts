import { svelte } from '@yapyak/svelte/processor';
import { defineConfig } from 'yapyak/config';

export default defineConfig({
  persistence: 'cookie',
  processors: [svelte()],
  syncHtmlLang: true,
});

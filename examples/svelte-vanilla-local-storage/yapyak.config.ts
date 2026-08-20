import { svelte } from '@yapyak/svelte/processor';
import { defineConfig } from 'yapyak/config';

export default defineConfig({
  persistence: 'local-storage',
  processors: [
    svelte(),
  ],
  syncHtmlAttributes: true,
});

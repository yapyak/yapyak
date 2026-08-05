import { vue } from '@yapyak/vue/processor';
import { defineConfig } from 'yapyak/config';

export default defineConfig({
  persistence: 'cookie',
  processors: [
    vue(),
  ],
  syncHtmlLang: true,
});

import { vue } from '@yapyak/vue/processor';
import { defineConfig } from 'yapyak/config';

export default defineConfig({
  persistence: 'local-storage',
  processors: [vue()],
  syncHtmlLang: true,
});

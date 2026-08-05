import { react } from '@yapyak/react/processor';
import { defineConfig } from 'yapyak/config';

export default defineConfig({
  persistence: 'local-storage',
  processors: [
    react(),
  ],
  syncHtmlLang: true,
});

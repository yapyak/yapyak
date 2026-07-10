import { react } from '@yapyak/react/processor';
import { defineConfig } from 'yapyak/config';

export default defineConfig({
  persistence: 'url',
  processors: [
    react(),
  ],
  syncHtmlLang: true,
});

import { react } from '@yapyak/react/processor';
import { defineConfig } from 'yapyak/config';

export default defineConfig({
  include: [
    'app',
  ],
  persistence: 'url',
  processors: [
    react(),
  ],
});

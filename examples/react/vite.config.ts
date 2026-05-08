import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { yapyak } from 'yapyak/vite';

export default defineConfig({
  plugins: [
    yapyak({
      cookie: 'locale',
      defaultLocale: 'en',
      framework: 'react',
      locales: ['en', 'sv'],
    }),
    react(),
  ],
});

import react from '@vitejs/plugin-react';
import { yapyak } from '@yapyak/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    react({
      compiler: true,
    }),
    yapyak({
      fixedLocale: process.env.YAPYAK_LOCALE,
    }),
  ],
});

import react from '@vitejs/plugin-react';
import { yapyak } from '@yapyak/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), yapyak()],
});

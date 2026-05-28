import { reactRouter } from '@react-router/dev/vite';
import { yapyak } from '@yapyak/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [reactRouter(), yapyak()],
});

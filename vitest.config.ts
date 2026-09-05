import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  root: process.cwd(),
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname) } },
  test: {
    dir: './',
    exclude: ['e2e/**', 'node_modules/**', '.next/**'],
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: { reporter: ['text', 'html'] },
  },
});

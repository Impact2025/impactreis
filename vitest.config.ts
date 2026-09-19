import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    // e2e/ bevat Playwright-specs (eigen `test`-object) — Vitest zou ze anders ook proberen
    // te draaien en crasht daarop ("did not expect test.describe() to be called here").
    // tenant-isolation.test.ts draait tegen de ECHTE database (zie "test:integration" in
    // package.json, vereist --env-file=.env.local) — onder de placeholder-DATABASE_URL uit
    // src/test/setup.ts zou de beforeAll-hook falen en alle tests laten hangen als "pending".
    exclude: ['node_modules/**', 'e2e/**', 'src/lib/__tests__/tenant-isolation.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        '**/dist',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/types': path.resolve(__dirname, './src/types'),
    },
  },
});

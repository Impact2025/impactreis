import { defineConfig } from 'vitest/config';
import path from 'path';

// Losstaand van vitest.config.ts omdat dat bestand tenant-isolation.test.ts juist uitsluit van de
// standaard `vitest run` (die draait zonder productie-DB-toegang, zie de toelichting daar). Dit
// bestand draait uitsluitend via `npm run test:integration` (met --env-file=.env.local voor een
// echte DATABASE_URL) en laadt bewust niet src/test/setup.ts — dat zou de globale afterEach()
// cleanup/matchers van React Testing Library toevoegen die deze non-React integratietest niet nodig heeft.
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/lib/__tests__/tenant-isolation.test.ts'],
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

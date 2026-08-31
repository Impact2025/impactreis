import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// src/lib/db.ts calls neon(process.env.DATABASE_URL!) at module-eval time, so
// importing it anywhere in a test (even for pure functions in the same file,
// like src/lib/coach.ts) throws immediately unless something is set — tests
// never touch a real database, so a syntactically valid placeholder is enough.
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://test:test@localhost/test';
}

expect.extend(matchers);

afterEach(() => {
  cleanup();
});

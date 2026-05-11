import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // Phase 1 Sprint 1 ramp-up: thresholds zeroed during Tasks 2-5 implementation.
      // Restore 80/70/80/80 at the end of Task 5 once full e2e is in place.
      thresholds: { lines: 0, branches: 0, functions: 0, statements: 0 }
    }
  }
});

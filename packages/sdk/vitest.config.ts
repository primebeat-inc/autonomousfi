import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts'], // barrel re-export, no logic to cover
      thresholds: { lines: 95, branches: 85, functions: 95, statements: 95 }
    }
  }
});

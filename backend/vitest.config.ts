import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    env: { NODE_ENV: 'test' },
    setupFiles: ['./tests/setup.ts'],
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      include: ['src/modules/**/*.service.ts'],
      thresholds: {
        lines: 80,
        statements: 80,
      },
    },
  },
});

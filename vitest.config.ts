import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    root: 'apps/backend',
    include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
    exclude: ['node_modules'],
    env: {
      JWT_ACCESS_SECRET: 'test-access-secret-for-testing-purposes-only',
      JWT_REFRESH_SECRET: 'test-refresh-secret-for-testing-purposes-only',
      ANALYTICS_SALT: 'test-salt-for-testing',
    },
    coverage: {
      provider: 'v8',
      include: ['src/modules/**/*.service.ts', 'src/modules/**/*.repository.ts'],
      exclude: ['src/modules/analytics/tests'],
    },
  },
});

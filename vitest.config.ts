import { defineConfig } from 'vitest/config'

// Unit tests for code outside Nuxt's runtime; kept apart from vite.config.ts, which only configures `vp check`.
export default defineConfig({
  test: {
    include: ['shared/**/*.test.ts', 'server/**/*.test.ts', 'scripts/**/*.test.ts'],
    environment: 'node',
  },
})

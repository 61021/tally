import { defineConfig } from 'vite-plus'

// Nuxt owns Vite; this file only configures `vp check`. ESLint is the formatter, so oxfmt stays off.
export default defineConfig({
  check: { fmt: false },
  lint: {
    ignorePatterns: ['.nuxt/**', '.output/**', 'worker-configuration.d.ts'],
    options: { typeAware: false },
  },
})

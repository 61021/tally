import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
  modules: ['@nuxt/ui'],

  css: ['~/assets/css/main.css'],

  ui: {
    // Light, dark and OLED across four color sets are ours (app/assets/css/themes.css), not color-mode's.
    colorMode: false,
  },

  fonts: {
    families: [
      { name: 'Newsreader', provider: 'google', weights: ['300 700'], styles: ['normal', 'italic'] },
      { name: 'Geist', provider: 'google', weights: ['400 600'] },
      { name: 'Geist Mono', provider: 'google', weights: ['300 500'] },
    ],
  },

  icon: {
    serverBundle: 'local',
  },

  $development: {
    nitro: {
      alias: {
        '#imports': fileURLToPath(new URL('./server/dev/imports-shim.ts', import.meta.url)),
      },
    },
  },

  app: {
    head: {
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      ],
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
      ],
    },
  },

  compatibilityDate: '2026-09-01',

  devtools: { enabled: false },

  imports: { autoImport: false },
  components: { dirs: [] },

  nitro: {
    preset: 'cloudflare_module',
    imports: false,
  },

  runtimeConfig: {
    /** Seals the session cookie; rotating it signs everyone out. */
    sessionPassword: '',
    /** Keys the email hashes accounts are found by. Never rotate it: every account would become unreachable. */
    emailHashKey: '',
    turnstileSecretKey: '',
    public: {
      turnstileSiteKey: '',
    },
  },

  routeRules: {
    '/**': {
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Strict-Transport-Security': 'max-age=31536000',
      },
    },
  },
})

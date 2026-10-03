import { defineNuxtRouteMiddleware } from '#imports'
import { inkTransition } from '../utils/ink'

// Hooks can't go in nuxt.config, so every route takes them here; a layout change runs only the layout's transition.
export default defineNuxtRouteMiddleware((to) => {
  to.meta.pageTransition = inkTransition
  to.meta.layoutTransition = inkTransition
})

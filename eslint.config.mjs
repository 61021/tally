import antfu from '@antfu/eslint-config'

export default antfu({
  formatters: true,
  ignores: ['worker-configuration.d.ts'],
})

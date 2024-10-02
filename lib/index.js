module.exports = {
  configs: {
    recommended: {
      plugins: ['zustand-rules'],
      rules: {
        'zustand-rules/enforce-slices-when-large-state': 'warn',
        'zustand-rules/use-store-selectors': 'error',
        'zustand-rules/no-state-mutation': 'error',
        'zustand-rules/enforce-use-setstate': 'error',
        'zustand-rules/enforce-state-before-actions': 'error'
      }
    }
  }
};
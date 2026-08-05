const { name, version } = require('../package.json');

const rules = {
  'enforce-slices-when-large-state': require('./rules/enforce-slices-when-large-state'),
  'enforce-state-before-actions': require('./rules/enforce-state-before-actions'),
  'no-logic-in-selectors': require('./rules/no-logic-in-selectors'),
  'no-multiple-stores': require('./rules/no-multiple-stores'),
  'no-repeated-store-selectors': require('./rules/no-repeated-store-selectors'),
  'no-state-mutation': require('./rules/no-state-mutation'),
  'require-shallow-selector': require('./rules/require-shallow-selector'),
  'use-store-selectors': require('./rules/use-store-selectors'),
};

const recommendedRules = {
  'zustand-rules/enforce-slices-when-large-state': 'error',
  'zustand-rules/enforce-state-before-actions': 'error',
  'zustand-rules/no-logic-in-selectors': 'error',
  'zustand-rules/no-multiple-stores': 'error',
  'zustand-rules/no-repeated-store-selectors': 'error',
  'zustand-rules/no-state-mutation': 'error',
  'zustand-rules/require-shallow-selector': 'error',
  'zustand-rules/use-store-selectors': 'error',
};

const plugin = {
  meta: { name, version },
  rules,
  configs: {},
};

Object.assign(plugin.configs, {
  recommended: {
    plugins: ['zustand-rules'],
    rules: recommendedRules,
  },
  'flat/recommended': [
    {
      name: 'zustand-rules/recommended',
      plugins: { 'zustand-rules': plugin },
      rules: recommendedRules,
    },
  ],
});

module.exports = plugin;

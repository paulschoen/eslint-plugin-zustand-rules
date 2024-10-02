const { RuleTester } = require('eslint');
const rule = require('../lib/rules/use-store-selectors');

const ruleTester = new RuleTester({
  parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
});
ruleTester.run('use-store-selectors', rule, {
  valid: [
    'count = useStore(state => state.count);'
  ],
  invalid: [
    {
      code: 'count = useStore();',
      errors: [{ message: 'You should use selectors when calling useStore to improve performance.' }]
    },
    {
      code: 'const store = useStore(state => state.count, anotherState => anotherState.value);',
      errors: [{ message: 'You should use selectors when calling useStore to improve performance.' }]
    }
  ]
});

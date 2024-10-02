const { RuleTester } = require('eslint');
const rule = require('../lib/rules/separate-action-creators');

const ruleTester = new RuleTester({
  parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
});

ruleTester.run('separate-action-creators', rule, {
  valid: [
    'const setCount = () => set(state => ({ count: state.count + 1 }));',
  ],
  invalid: [
    {
      code: 'const setCount = () => { state.count += 1; };',
      errors: [
        {
          message:
            'Action creators should be separated from the store state to follow Flux architecture.',
        },
      ],
    },
  ],
});

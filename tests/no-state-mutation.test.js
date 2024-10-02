const { RuleTester } = require('eslint');
const rule = require('../lib/rules/no-state-mutation');

const ruleTester = new RuleTester({
  parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
});

ruleTester.run('no-state-mutation', rule, {
  valid: [
    'const setCount = () => set(state => ({ count: state.count + 1 }));',
  ],
  invalid: [
    {
      code: 'state.count += 1;',
      errors: [
        {
          message:
            'Direct mutation of state is not allowed. Use setState or an action creator.',
        },
      ],
    },
    {
      code: 'state.items.push(item);',
      errors: [
        {
          message:
            'Direct array mutations on state are not allowed. Use setState or an action creator.',
        },
      ],
    },
  ],
});

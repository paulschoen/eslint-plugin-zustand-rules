const rule = require('../lib/rules/require-shallow-selector');
const { createRuleTester } = require('./rule-tester');

createRuleTester().run('require-shallow-selector', rule, {
  valid: [
    'const count = useBearStore((state) => state.count);',
    'const items = useBearStore((state) => state.items);',
    `const { a, b } = useBearStore(useShallow((state) => ({ a: state.a, b: state.b })));`,
    `const [a, b] = useBearStore(useShallow((state) => [state.a, state.b]));`,
    'const count = useBearStore(selectBears);',
    'const value = notAStoreHook((state) => ({ a: state.a }));',
  ],
  invalid: [
    {
      code: 'const { a, b } = useBearStore((state) => ({ a: state.a, b: state.b }));',
      errors: [{ messageId: 'shallowRequired', data: { kind: 'object' } }],
    },
    {
      code: 'const [a, b] = useBearStore((state) => [state.a, state.b]);',
      errors: [{ messageId: 'shallowRequired', data: { kind: 'array' } }],
    },
    {
      code: `const value = useFishStore((state) => {
  return { a: state.a };
});`,
      errors: [{ messageId: 'shallowRequired' }],
    },
  ],
});

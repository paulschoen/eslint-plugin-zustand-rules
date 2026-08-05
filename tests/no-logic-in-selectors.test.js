const rule = require('../lib/rules/no-logic-in-selectors');
const { createRuleTester } = require('./rule-tester');

createRuleTester().run('no-logic-in-selectors', rule, {
  valid: [
    'const token = useBearStore((state) => state.honey);',
    'const value = useBearStore((state) => state.inputs.value);',
    'const value = useBearStore((state) => state.inputs[id]);',
    'const value = useBearStore((state) => state.user?.name);',
    'const value = useBearStore((state) => state[key]);',
    'const whole = useBearStore((state) => state);',
    'const token = useBearStore(selectHoney);',
    `const value = useBearStore((state) => {
       return state.inputs.value;
     });`,
    `const { a, b } = useBearStore(useShallow((state) => ({ a: state.a, b: state.b })));`,
    'const { a } = useBearStore((state) => ({ a: state.a }));',
    'const token = notAStoreHook((state) => state.a || state.b);',
    'const value = useBearStore(({ honey }) => honey || "");',
  ],
  invalid: [
    {
      code: 'const honey = useBearStore((state) => state.honey || state.nuts);',
      errors: [{ messageId: 'logicInSelector' }],
    },
    {
      code: 'const honey = useBearStore((state) => state.honey ?? state.nuts);',
      errors: [{ messageId: 'logicInSelector' }],
    },
    {
      code: 'const isReady = useBearStore((state) => !state.isLoading);',
      errors: [{ messageId: 'logicInSelector' }],
    },
    {
      code: 'const label = useBearStore((state) => state.count > 0 ? state.label : "none");',
      errors: [{ messageId: 'logicInSelector' }],
    },
    {
      code: 'const keys = useBearStore((state) => Object.keys(state.treats));',
      errors: [{ messageId: 'logicInSelector' }],
    },
    {
      code: 'const names = useBearStore((state) => state.items.map((item) => item.name));',
      errors: [{ messageId: 'logicInSelector' }],
    },
    {
      code: 'const total = useBearStore((state) => state.count + 1);',
      errors: [{ messageId: 'logicInSelector' }],
    },
    {
      code: `const label = useBearStore((state) => \`\${state.first} \${state.last}\`);`,
      errors: [{ messageId: 'logicInSelector' }],
    },
    {
      code: `const token = useBearStore((state) => {
       return state.honey || state.nuts;
     });`,
      errors: [{ messageId: 'logicInSelector' }],
    },
  ],
});

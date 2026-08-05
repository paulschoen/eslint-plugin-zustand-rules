const rule = require('../lib/rules/selector-name-matches-property');
const { createRuleTester } = require('./rule-tester');

createRuleTester().run('selector-name-matches-property', rule, {
  valid: [
    'const bears = useBearStore((state) => state.bears);',
    'const bears = useBearStore((s) => s.bears);',
    'const name = useBearStore((state) => state.user.name);',
    'const name = useBearStore((state) => state.user?.name);',
    'const setBears = useBearStore((state) => state.setBears);',
    'const value = useBearStore((state) => state[key]);',
    'const whole = useBearStore((state) => state);',
    'const rabbits = useBearStore(selectBears);',
    'const rabbits = useBearStore((state) => state.bears || state.nuts);',
    'const { bears } = useBearStore(useShallow((state) => ({ bears: state.bears })));',
    'const [bears] = useBearStore((state) => state.pair);',
    'const rabbits = form.useStore((state) => state.bears);',
    'const rabbits = notAStoreHook((state) => state.bears);',
    'useBearStore((state) => state.bears);',
    {
      code: 'const rabbits = useBearStore((state) => state.bears);',
      options: [{ storeHookPattern: '^useFishStore$' }],
    },
  ],
  invalid: [
    {
      code: 'const bears = useBearStore((state) => state.rabbits);',
      output: null,
      errors: [{ messageId: 'nameMismatch', data: { name: 'bears', property: 'rabbits' } }],
    },
    {
      code: 'const bears = useBearStore((s) => s.rabbits);',
      output: null,
      errors: [{ messageId: 'nameMismatch' }],
    },
    {
      code: 'const label = useBearStore((state) => state.user.name);',
      output: null,
      errors: [{ messageId: 'nameMismatch', data: { name: 'label', property: 'name' } }],
    },
    {
      code: 'const label = useBearStore((state) => state.user?.name);',
      output: null,
      errors: [{ messageId: 'nameMismatch', data: { name: 'label', property: 'name' } }],
    },
    {
      code: 'const isOpen = useGlobalStore((state) => state.isDocumentationModalOpen);',
      output: null,
      errors: [
        { messageId: 'nameMismatch', data: { name: 'isOpen', property: 'isDocumentationModalOpen' } },
      ],
    },
    {
      code: 'const Bears = useBearStore((state) => state.bears);',
      output: null,
      errors: [{ messageId: 'nameMismatch' }],
    },
    {
      code: 'const rabbits = useFishStore((state) => state.bears);',
      options: [{ storeHookPattern: '^useFishStore$' }],
      output: null,
      errors: [{ messageId: 'nameMismatch' }],
    },
  ],
});

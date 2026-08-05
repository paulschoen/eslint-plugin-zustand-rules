const rule = require('../lib/rules/use-store-selectors');
const { createRuleTester } = require('./rule-tester');

createRuleTester().run('use-store-selectors', rule, {
  valid: [
    'const count = useStore((state) => state.count);',
    'const count = useBearStore((state) => state.count);',
    'const count = useFishStore((store) => store.count);',
    'const count = useBearStore(selectBears);',
    'const value = useBearStore(useShallow((state) => ({ a: state.a })));',
    'const count = useStore(vanillaStore, (state) => state.count);',
    'const data = useQuery({ queryKey: [] });',
    'const [state, setState] = useState();',
  ],
  invalid: [
    {
      code: 'const store = useStore();',
      output: null,
      errors: [{ messageId: 'selectorRequired', data: { hookName: 'useStore' } }],
    },
    {
      code: 'const store = useBearStore();',
      output: null,
      errors: [{ messageId: 'selectorRequired' }],
    },
    {
      code: 'const count = useBearStore((state) => state.count, shallow);',
      output: `import { useShallow } from 'zustand/react/shallow';
const count = useBearStore(useShallow((state) => state.count));`,
      errors: [{ messageId: 'equalityFnRemoved' }],
    },
    {
      code: `import { shallow } from 'zustand/shallow';
const { a, b } = useBearStore((state) => ({ a: state.a, b: state.b }), shallow);`,
      output: `import { shallow, useShallow } from 'zustand/shallow';
const { a, b } = useBearStore(useShallow((state) => ({ a: state.a, b: state.b })));`,
      errors: [{ messageId: 'equalityFnRemoved' }],
    },
    {
      code: 'const count = useBearStore((state) => state.count, shallow, extra);',
      output: null,
      errors: [{ messageId: 'equalityFnRemoved' }],
    },
  ],
});

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
      errors: [{ messageId: 'selectorRequired', data: { hookName: 'useStore' } }],
    },
    {
      code: 'const store = useBearStore();',
      errors: [{ messageId: 'selectorRequired' }],
    },
    {
      code: 'const count = useBearStore((state) => state.count, shallow);',
      errors: [{ messageId: 'equalityFnRemoved' }],
    },
  ],
});

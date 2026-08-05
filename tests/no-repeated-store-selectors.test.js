const rule = require('../lib/rules/no-repeated-store-selectors');
const { createRuleTester } = require('./rule-tester');

createRuleTester().run('no-repeated-store-selectors', rule, {
  valid: [
    `const useThing = () => {
       const bears = useBearStore((state) => state.bears);
       return bears;
     };`,

    `const useThing = () => {
       const bears = useBearStore((state) => state.bears);
       const location = useBearStore((state) => state.fish);
       return { bears, location };
     };`,

    `const useThing = () => {
       const { bears, fish, honey } = useBearStore(
         useShallow((state) => ({
           bears: state.bears,
           fish: state.fish,
           honey: state.honey || state.nuts,
         })),
       );
       return bears;
     };`,

    `const useOne = () => {
       const bears = useBearStore((state) => state.bears);
       return bears;
     };
     const useTwo = () => {
       const location = useBearStore((state) => state.fish);
       return location;
     };
     const useThree = () => {
       const token = useBearStore((state) => state.honey);
       return token;
     };`,

    `const useThing = () => {
       const bears = useBearStore((state) => state.bears);
       const location = useBearStore((state) => state.fish);
       const token = useFishStore((state) => state.honey);
       return { bears, location, token };
     };`,
  ],
  invalid: [
    {
      code: `const useThing = () => {
       const bears = useBearStore((state) => state.bears);
       const fish = useBearStore((state) => state.fish);
       const honey = useBearStore((state) => state.honey || state.nuts);
       return { bears, fish, honey };
     };`,
      errors: [
        {
          messageId: 'repeatedSelectors',
          data: { hookName: 'useBearStore', count: 3 },
        },
      ],
    },
    {
      code: `const useThing = () => {
       const bears = useBearStore((state) => state.bears);
       const location = useBearStore((state) => state.fish);
       return { bears, location };
     };`,
      options: [{ maxCalls: 1 }],
      errors: [
        {
          messageId: 'repeatedSelectors',
          data: { hookName: 'useBearStore', count: 2 },
        },
      ],
    },
    {
      code: `function useThing() {
       const a = useBearStore((store) => store.bears);
       const b = useBearStore((store) => store.fish);
       const c = useBearStore((store) => store.honey);
       const d = useBearStore((store) => store.nuts);
       return { a, b, c, d };
     }`,
      errors: [
        {
          messageId: 'repeatedSelectors',
          data: { hookName: 'useBearStore', count: 4 },
        },
      ],
    },
    {
      code: `const useThing = () => {
       const a = useBearStore((state) => state.a);
       const b = useBearStore((state) => state.b);
       const c = useBearStore((state) => state.c);
       const x = useFishStore((state) => state.x);
       const y = useFishStore((state) => state.y);
       const z = useFishStore((state) => state.z);
       return { a, b, c, x, y, z };
     };`,
      errors: [
        {
          messageId: 'repeatedSelectors',
          data: { hookName: 'useBearStore', count: 3 },
        },
        {
          messageId: 'repeatedSelectors',
          data: { hookName: 'useFishStore', count: 3 },
        },
      ],
    },
  ],
});

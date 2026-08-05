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
    `const Component = () => {
       const errorMap = form.useStore((state) => state.errorMap);
       const repaired = form.useStore((state) => state.values.repaired);
       const boughtOff = form.useStore((state) => state.values.boughtOff);
       return { errorMap, repaired, boughtOff };
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
      output: null,
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
      output: `import { useShallow } from 'zustand/react/shallow';
const useThing = () => {
       const { bears, location } = useBearStore(useShallow((state) => ({ bears: state.bears, location: state.fish })));
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
      output: `import { useShallow } from 'zustand/react/shallow';
function useThing() {
       const { a, b, c, d } = useBearStore(useShallow((state) => ({ a: state.bears, b: state.fish, c: state.honey, d: state.nuts })));
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
      output: `import { useShallow } from 'zustand/react/shallow';
const useThing = () => {
       const { a, b, c } = useBearStore(useShallow((state) => ({ a: state.a, b: state.b, c: state.c })));
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
    {
      code: `const useThing = () => {
       const bears = useBearStore((state) => state.bears);
       const fish = useBearStore((state) => state.fish);
       useBearStore((state) => state.honey);
       return { bears, fish };
     };`,
      output: null,
      errors: [{ messageId: 'repeatedSelectors', data: { hookName: 'useBearStore', count: 3 } }],
    },
    {
      code: `export const a = useBearStore((state) => state.a);
export const b = useBearStore((state) => state.b);
export const c = useBearStore((state) => state.c);`,
      output: null,
      errors: [{ messageId: 'repeatedSelectors', data: { hookName: 'useBearStore', count: 3 } }],
    },
    {
      code: `function useThing(x) {
  const a = useBearStore((state) => state.a);
  const b = useBearStore((state) => state.b);
  if (x) {
    const c = useBearStore((state) => state.c);
    return c;
  }
  return { a, b };
}`,
      output: null,
      errors: [{ messageId: 'repeatedSelectors', data: { hookName: 'useBearStore', count: 3 } }],
    },
    {
      code: `function useThing() {
  const a = useBearStore<Bears>((state) => state.a);
  const b = useBearStore<Bears>((state) => state.b);
  const c = useBearStore<Bears>((state) => state.c);
  return { a, b, c };
}`,
      output: `import { useShallow } from 'zustand/react/shallow';
function useThing() {
  const { a, b, c } = useBearStore<Bears>(useShallow((state) => ({ a: state.a, b: state.b, c: state.c })));
  return { a, b, c };
}`,
      errors: [{ messageId: 'repeatedSelectors', data: { hookName: 'useBearStore', count: 3 } }],
    },
    {
      code: `function useThing() {
  const a = useBearStore((state) => state.a);
  const b = useBearStore((state) => state.b);
  const c = useBearStore((state) => state.c); // the honey count
  return { a, b, c };
}`,
      output: null,
      errors: [{ messageId: 'repeatedSelectors', data: { hookName: 'useBearStore', count: 3 } }],
    },
    {
      code: `const useThing = () => {
       const bears = useBearStore((state) => state.bears);
       // keeps the fish honest
       const fish = useBearStore((state) => state.fish);
       const honey = useBearStore((state) => state.honey);
       return { bears, fish, honey };
     };`,
      output: null,
      errors: [{ messageId: 'repeatedSelectors', data: { hookName: 'useBearStore', count: 3 } }],
    },
  ],
});

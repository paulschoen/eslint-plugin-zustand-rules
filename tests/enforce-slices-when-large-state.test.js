const rule = require('../lib/rules/enforce-slices-when-large-state');
const { createRuleTester } = require('./rule-tester');

const buildStore = (count) => {
  const properties = Array.from({ length: count }, (_, index) => `  prop${index}: ${index},`);

  return `import { create } from 'zustand';
const useStore = create((set) => ({
${properties.join('\n')}
}));`;
};

createRuleTester().run('enforce-slices-when-large-state', rule, {
  valid: [
    buildStore(3),
    { code: buildStore(4), options: [{ maxProperties: 4 }] },
    `import { create } from 'zustand';
const useStore = create<Store>()(urlSync({ stateToUrlMap: {} }, (...args) => ({
  ...createOneSlice(...args),
  ...createTwoSlice(...args),
  ...createThreeSlice(...args),
})));`,

    buildStore(21).replace("import { create } from 'zustand';\n", ''),

    `import { create } from 'zustand';
function helper() { return 1; }`,

    `import { create } from 'zustand';
const useStore = create((set) => makeSlice(set));`,

    `import { create } from 'zustand';
const useStore = create((set) => { return makeSlice(set); });`,

    `import { create } from 'zustand';
const useStore = create!((set) => ({ count: 0 }));`,

    `import { create } from 'zustand';
const useStore = (create<Store>)((set) => ({ count: 0 }));`,

    `import { create } from 'zustand';
(function () { return 1; })();`,

    `import { create } from 'zustand';
const createSlice = ((set) => ({ count: 0 })) as StateCreator<Slice>;`,

    `import { create } from 'zustand';
const createSlice: (set: unknown) => object = (set) => ({ count: 0 });`,

    `import { create } from 'zustand';
wrap((set) => ({ count: 0 }));`,
  ],
  invalid: [
    {
      code: buildStore(21),
      errors: [{ messageId: 'tooManyProperties', data: { count: 21, max: 20 } }],
    },
    {
      code: buildStore(5),
      options: [{ maxProperties: 4 }],
      errors: [{ messageId: 'tooManyProperties', data: { count: 5, max: 4 } }],
    },
    {
      code: `import type { StateCreator } from 'zustand';
export const createSlice: StateCreator<Slice> = (set) => ({
  a: 1,
  b: 2,
  c: 3,
});`,
      options: [{ maxProperties: 2 }],
      errors: [{ messageId: 'tooManyProperties' }],
    },
  ],
});

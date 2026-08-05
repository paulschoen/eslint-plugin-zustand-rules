const rule = require('../lib/rules/no-state-mutation');
const { createRuleTester } = require('./rule-tester');

createRuleTester().run('no-state-mutation', rule, {
  valid: [
    `import { create } from 'zustand';
     const useStore = create((set) => ({
       count: 0,
       increment: () => set((state) => ({ count: state.count + 1 })),
     }));`,

    `import type { StateCreator } from 'zustand';
     export const createCountSlice: StateCreator<CountSlice> = (set) => ({
       count: 0,
       reset: () => { set({ count: 0 }); },
     });`,

    `import { create } from 'zustand';
     import { immer } from 'zustand/middleware/immer';
     const useStore = create(immer((set) => ({
       count: 0,
       increment: () => set((state) => { state.count += 1; }),
     })));`,

    `const state = { count: 0 };
     state.count = 1;`,

    `import { create } from 'zustand';
     const useStore = create((set) => ({ items: [] }));
     function unrelated(state) { state.items.push(1); }`,
  ],
  invalid: [
    {
      code: `import { create } from 'zustand';
const useStore = create((set) => ({
  count: 0,
  increment: () => { state.count = 5; },
}));`,
      output: `import { create } from 'zustand';
const useStore = create((set) => ({
  count: 0,
  increment: () => { set({ count: 5 }); },
}));`,
      errors: [{ messageId: 'assignment' }],
    },
    {
      code: `import { create } from 'zustand';
const useStore = create((set) => ({
  count: 0,
  double: () => { state.count = state.count * 2; },
}));`,
      output: `import { create } from 'zustand';
const useStore = create((set) => ({
  count: 0,
  double: () => { set((state) => ({ count: state.count * 2 })); },
}));`,
      errors: [{ messageId: 'assignment' }],
    },
    {
      code: `import { create } from 'zustand';
const useStore = create((set) => ({
  count: 0,
  increment: () => { state.count += 1; },
}));`,
      output: `import { create } from 'zustand';
const useStore = create((set) => ({
  count: 0,
  increment: () => { set((state) => ({ count: state.count + 1 })); },
}));`,
      errors: [{ messageId: 'assignment' }],
    },
    {
      code: `import { create } from 'zustand';
const useStore = create((setState) => ({
  count: 0,
  increment: () => { state['count'] = 5; },
}));`,
      output: `import { create } from 'zustand';
const useStore = create((setState) => ({
  count: 0,
  increment: () => { setState({ count: 5 }); },
}));`,
      errors: [{ messageId: 'assignment' }],
    },
    {
      code: `import { create } from 'zustand';
const useStore = create((set) => ({
  bears: 0,
  scale: () => { state.bears *= 1 + 2; },
}));`,
      output: `import { create } from 'zustand';
const useStore = create((set) => ({
  bears: 0,
  scale: () => { set((state) => ({ bears: state.bears * (1 + 2) })); },
}));`,
      errors: [{ messageId: 'assignment' }],
    },
    {
      code: `import { create } from 'zustand';
const useStore = create((set) => ({
  label: '',
  rename: () => { state.label = 'state of the art'; },
}));`,
      output: `import { create } from 'zustand';
const useStore = create((set) => ({
  label: '',
  rename: () => { set({ label: 'state of the art' }); },
}));`,
      errors: [{ messageId: 'assignment' }],
    },
    {
      code: `import type { StateCreator } from 'zustand';
export const createSlice: StateCreator<Slice> = (set) => ({
  items: [],
  add: (item) => { state.items.push(item); },
});`,
      errors: [{ messageId: 'arrayMutation' }],
    },
    {
      code: `import { create } from 'zustand';
const useStore = create<Store>()((set) => ({
  nested: { count: 0 },
  bump: () => { state.nested.count = 1; },
}));`,
      errors: [{ messageId: 'assignment' }],
    },
  ],
});

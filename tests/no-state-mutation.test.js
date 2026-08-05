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
      output: `import type { StateCreator } from 'zustand';
export const createSlice: StateCreator<Slice> = (set) => ({
  items: [],
  add: (item) => { set((state) => ({ items: [...state.items, item] })); },
});`,
      errors: [{ messageId: 'arrayMutation' }],
    },
    {
      code: `import { create } from 'zustand';
const useStore = create((set) => ({
  items: [],
  addMany: (a, b) => { state.items.push(a, ...b); },
}));`,
      output: `import { create } from 'zustand';
const useStore = create((set) => ({
  items: [],
  addMany: (a, b) => { set((state) => ({ items: [...state.items, a, ...b] })); },
}));`,
      errors: [{ messageId: 'arrayMutation' }],
    },
    {
      code: `import { create } from 'zustand';
const useStore = create((set) => ({
  items: [],
  prepend: (item) => { state.items.unshift(item); },
}));`,
      output: `import { create } from 'zustand';
const useStore = create((set) => ({
  items: [],
  prepend: (item) => { set((state) => ({ items: [item, ...state.items] })); },
}));`,
      errors: [{ messageId: 'arrayMutation' }],
    },
    {
      code: `import { create } from 'zustand';
const useStore = create((set) => ({
  items: [],
  take: () => { const last = state.items.pop(); return last; },
}));`,
      output: null,
      errors: [{ messageId: 'arrayMutation' }],
    },
    {
      code: `import { create } from 'zustand';
const useStore = create((set) => ({
  items: [],
  count: () => { const size = state.items.push(1); return size; },
}));`,
      output: null,
      errors: [{ messageId: 'arrayMutation' }],
    },
    {
      code: `import { create } from 'zustand';
const useStore = create((set) => ({
  nested: { items: [] },
  add: (item) => { state.nested.items.push(item); },
}));`,
      output: null,
      errors: [{ messageId: 'arrayMutation' }],
    },
    {
      code: `import { create } from 'zustand';
const useStore = create<Store>()((set) => ({
  nested: { count: 0 },
  bump: () => { state.nested.count = 1; },
}));`,
      output: null,
      errors: [{ messageId: 'assignment' }],
    },
  ],
});

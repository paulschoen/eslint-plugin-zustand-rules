const rule = require('../lib/rules/enforce-state-before-actions');
const { createRuleTester } = require('./rule-tester');

createRuleTester().run('enforce-state-before-actions', rule, {
  valid: [
    `import { create } from 'zustand';
     const useStore = create((set) => ({
       count: 0,
       label: 'a',
       increment: () => set((state) => ({ count: state.count + 1 })),
       reset: () => set({ count: 0 }),
     }));`,

    `import type { StateCreator } from 'zustand';
     export const createSlice: StateCreator<Slice> = (set) => ({
       open: false,
       setOpen: (open) => { set({ open }); },
     });`,

    `import { create } from 'zustand';
     const useStore = create<Store>()(urlSync({ stateToUrlMap: {} }, (...args) => ({
       ...createOneSlice(...args),
       ...createTwoSlice(...args),
     })));`,

    `const config = { onInit: () => {}, name: 'x' };`,
  ],
  invalid: [
    {
      code: `import { create } from 'zustand';
     const useStore = create((set) => ({
       count: 0,
       increment: () => set({ count: 1 }),
       label: 'a',
     }));`,
      output: `import { create } from 'zustand';
     const useStore = create((set) => ({
       count: 0,
       label: 'a',
       increment: () => set({ count: 1 }),
     }));`,
      errors: [{ messageId: 'stateBeforeActions', data: { propertyName: 'label' } }],
    },
    {
      code: `import type { StateCreator } from 'zustand';
     export const createSlice: StateCreator<Slice> = (set) => {
       return {
         open: false,
         setOpen: (open) => { set({ open }); },
         title: '',
       };
     };`,
      output: `import type { StateCreator } from 'zustand';
     export const createSlice: StateCreator<Slice> = (set) => {
       return {
         open: false,
         title: '',
         setOpen: (open) => { set({ open }); },
       };
     };`,
      errors: [{ messageId: 'stateBeforeActions', data: { propertyName: 'title' } }],
    },
    {
      code: `import { create } from 'zustand';
     const useStore = create((...args) => ({
       count: 0,
       ...createOneSlice(...args),
       increment: () => set({ count: 1 }),
       label: 'a',
     }));`,
      output: null,
      errors: [{ messageId: 'stateBeforeActions', data: { propertyName: 'label' } }],
    },
    {
      code: `import { create } from 'zustand';
const useStore = create((set) => ({ count: 0, increment: () => set({ count: 1 }), label: 'a' }));`,
      output: `import { create } from 'zustand';
const useStore = create((set) => ({ count: 0, label: 'a', increment: () => set({ count: 1 }) }));`,
      errors: [{ messageId: 'stateBeforeActions', data: { propertyName: 'label' } }],
    },
    {
      code: `import { create } from 'zustand';
     const useStore = create((set) => ({
       increment: () => set({ count: 1 }),
       // the label the bear answers to
       label: 'a',
     }));`,
      output: null,
      errors: [{ messageId: 'stateBeforeActions', data: { propertyName: 'label' } }],
    },
  ],
});

const { RuleTester } = require('eslint');
const rule = require('../lib/rules/enforce-slices-when-large-state');

const ruleTester = new RuleTester({
  parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
});

ruleTester.run('enforce-slices-when-large-state', rule, {
  valid: [
    {
      code: `
        import { create } from 'zustand';
        const useStore = create((set) => ({
          bears: 0,
          incrementBears: () => set((state) => ({ bears: state.bears + 1 })),
        }));
      `,
      options: [{ maxProperties: 5 }],
    },
  ],
  invalid: [
    {
      code: `
        import { create } from 'zustand';
        const useStore = create((set) => ({
          bears: 0,
          fish: 'salmon',
          birds: {
            eagle: 2,
            sparrow: 10,
          },
          trees: 0,
          plants: 0,
          incrementBears: () => set((state) => ({ bears: state.bears + 1 })),
        }));
      `,
      errors: [{ message: 'The Zustand store contains more than 5 properties. Consider splitting the store into slices.' }],
      options: [{ maxProperties: 5 }],
    },
  ],
});

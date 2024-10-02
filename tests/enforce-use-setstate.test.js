const { RuleTester } = require('eslint');
const rule = require('../lib/rules/enforce-use-setstate');

const ruleTester = new RuleTester({
    parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
});

ruleTester.run('enforce-use-setstate', rule, {
    valid: [
        {
            code: `
                import { create } from 'zustand';
                const useStore = create((set) => ({
                    count: 0,
                    increment: () => set((state) => ({ count: state.count + 1 })),
                }));
            `,
        },
        {
            code: `
                import { create } from 'zustand';
                const useStore = create((set) => ({
                    count: 0,
                    increment: () => setState((state) => ({ count: state.count + 1 })),
                }));
            `,
        },
        {
            code: `
                import { create } from 'zustand';
                const useStore = create((set) => ({
                    count: 0,
                    increment: () => set((state) => ({ count: state['count'] + 1 })),
                }));
            `,
        },
    ],

    invalid: [
        {
            code: `
                import { create } from 'zustand';
                const useStore = create((set) => ({
                    count: 0,
                    increment: () => { state.count = state.count + 1; },
                }));
            `,
            errors: [{ message: 'Direct state mutation detected. Use set or setState for store updates.' }],
            output: `
                import { create } from 'zustand';
                const useStore = create((set) => ({
                    count: 0,
                    increment: () => { set((state) => ({ count: state.count + 1 })); },
                }));
            `,
        },
        {
            code: `
                import { create } from 'zustand';
                const useStore = create((set) => ({
                    count: 0,
                    increment: () => { state.count = 5; },
                }));
            `,
            errors: [{ message: 'Direct state mutation detected. Use set or setState for store updates.' }],
            output: `
                import { create } from 'zustand';
                const useStore = create((set) => ({
                    count: 0,
                    increment: () => { set((state) => ({ count: 5 })); },
                }));
            `,
        },
        {
            code: `
                import { create } from 'zustand';
                const useStore = create((set) => ({
                    count: 0,
                    increment: () => { state.count += 1; },
                }));
            `,
            errors: [{ message: 'Direct state mutation detected. Use set or setState for store updates.' }],
            output: `
                import { create } from 'zustand';
                const useStore = create((set) => ({
                    count: 0,
                    increment: () => { set((state) => ({ count: state.count + 1 })); },
                }));
            `,
        },
        {
            code: `
                import { create } from 'zustand';
                const useStore = create((set) => ({
                    count: 0,
                    increment: () => { state['count'] = 5; },
                }));
            `,
            errors: [{ message: 'Direct state mutation detected. Use set or setState for store updates.' }],
            output: `
                import { create } from 'zustand';
                const useStore = create((set) => ({
                    count: 0,
                    increment: () => { set((state) => ({ count: 5 })); },
                }));
            `,
        },
    ],
});

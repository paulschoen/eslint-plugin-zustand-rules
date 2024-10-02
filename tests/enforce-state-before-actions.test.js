const { RuleTester } = require('eslint');
const rule = require('../lib/rules/enforce-state-before-actions');

const ruleTester = new RuleTester({
    parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
});

ruleTester.run('enforce-state-before-actions', rule, {
    valid: [
        {
            code: `
                import { create } from 'zustand';
                const useStore = create((set) => ({
                    state1: 'value1',
                    state2: 'value2',
                    action1: () => set({ state1: 'newValue1' }),
                    action2: () => set({ state2: 'newValue2' }),
                }));
            `,
        },
        {
            code: `
                import { create } from 'zustand';
                const useStore = create((set) => ({
                    state1: 'value1',
                    action1: () => set({ state1: 'newValue1' }),
                }));
            `,
        },
    ],
    invalid: [
        {
            code: `
                import { create } from 'zustand';
                const useStore = create((set) => ({
                    action1: () => set({ state1: 'newValue1' }),
                    state1: 'value1',
                }));
            `,
            errors: [{ messageId: 'stateBeforeActions' }],
        },
        {
            code: `
                import { create } from 'zustand';
                const useStore = create((set) => ({
                    action1: () => set({ state1: 'newValue1' }),
                    state1: 'value1',
                    action2: () => set({ state2: 'newValue2' }),
                    state2: 'value2',
                }));
            `,
            errors: [
                { messageId: 'stateBeforeActions' },
                { messageId: 'stateBeforeActions' },
            ],
        },
    ],
});
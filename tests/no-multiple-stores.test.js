const { RuleTester } = require('eslint');
const rule = require('../lib/rules/no-multiple-stores');

const ruleTester = new RuleTester({
    parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
});

ruleTester.run('no-multiple-stores', rule, {
    valid: [
        {
            code: `
                const useStore = create(set => ({
                    count: 0,
                    increment: () => set(state => ({ count: state.count + 1 })),
                }));
            `,
        },
    ],

    invalid: [
        {
            code: `
                const useStore1 = create(set => ({
                    count: 0,
                    increment: () => set(state => ({ count: state.count + 1 })),
                }));
                const useStore2 = create(set => ({
                    count: 0,
                    increment: () => set(state => ({ count: state.count + 1 })),
                }));
            `,
            errors: [{ message: 'Multiple Zustand stores detected. Only one store should be used per module.' }],
        },
    ],
});
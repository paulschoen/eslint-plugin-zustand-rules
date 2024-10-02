const { RuleTester } = require('eslint');
const rule = require('../lib/rules/colocate-actions-in-store');

const ruleTester = new RuleTester({
    parserOptions: { ecmaVersion: 2020, sourceType: 'module' },
});

ruleTester.run('colocate-actions-in-store', rule, {
    valid: [
        {
            code: `
                const useStore = create((set) => ({
                    action: () => set({ key: 'value' })
                }));
            `,
        },
        {
            code: `
                const useStore = create((set) => ({
                    action: () => {
                        set({ key: 'value' });
                    }
                }));
            `,
        },
    ],

    invalid: [
        {
            code: `
                const useStore = create(() => ({
                    action: () => {}
                }));
            `,
            errors: [{ message: 'Store action must use set or setState.' }],
        },
        {
            code: `
                const useStore = create(() => ({
                    action: () => {
                        // some logic
                    }
                }));
            `,
            errors: [{ message: 'Store action must use set or setState.' }],
        },
    ],
});
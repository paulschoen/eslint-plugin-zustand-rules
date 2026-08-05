const rule = require('../lib/rules/no-multiple-stores');
const { createRuleTester } = require('./rule-tester');

createRuleTester().run('no-multiple-stores', rule, {
  valid: [
    `import { create } from 'zustand';
     const useStore = create((set) => ({ count: 0 }));`,

    `import { create } from 'zustand';
     const useStore = create<Store>()(persist((set) => ({ count: 0 }), { name: 'x' }));`,

    `import { create } from 'zustand';
     import { createSelector } from 'reselect';
     const useStore = create((set) => ({ count: 0 }));
     const selector = createSelector([], () => null);`,

    `const first = create({ a: 1 });
     const second = create({ b: 2 });`,

    `import { useShallow } from 'zustand/react/shallow';
     const empty = Message.create({});
     const other = Message.create({ id: '1' });`,

    `import { create } from 'zustand';
     const useStore = create((set) => ({ count: 0 }));
     const message = Message.create({});`,

    `import type { StateCreator } from 'zustand';
     const a = Message.create({});
     const b = Message.create({});`,
  ],
  invalid: [
    {
      code: `import { create } from 'zustand';
     const useFirst = create((set) => ({ count: 0 }));
     const useSecond = create((set) => ({ other: 0 }));`,
      errors: [{ messageId: 'multipleStores' }],
    },
  ],
});

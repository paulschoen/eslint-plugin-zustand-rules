const rule = require('../lib/rules/require-shallow-selector');
const { createRuleTester } = require('./rule-tester');

createRuleTester().run('require-shallow-selector', rule, {
  valid: [
    'const count = useBearStore((state) => state.count);',
    'const items = useBearStore((state) => state.items);',
    `const { a, b } = useBearStore(useShallow((state) => ({ a: state.a, b: state.b })));`,
    `const [a, b] = useBearStore(useShallow((state) => [state.a, state.b]));`,
    'const count = useBearStore(selectBears);',
    'const value = notAStoreHook((state) => ({ a: state.a }));',
  ],
  invalid: [
    {
      code: 'const { a, b } = useBearStore((state) => ({ a: state.a, b: state.b }));',
      output: `import { useShallow } from 'zustand/react/shallow';
const { a, b } = useBearStore(useShallow((state) => ({ a: state.a, b: state.b })));`,
      errors: [{ messageId: 'shallowRequired', data: { kind: 'object' } }],
    },
    {
      code: 'const [a, b] = useBearStore((state) => [state.a, state.b]);',
      output: `import { useShallow } from 'zustand/react/shallow';
const [a, b] = useBearStore(useShallow((state) => [state.a, state.b]));`,
      errors: [{ messageId: 'shallowRequired', data: { kind: 'array' } }],
    },
    {
      code: `const value = useFishStore((state) => {
  return { a: state.a };
});`,
      output: `import { useShallow } from 'zustand/react/shallow';
const value = useFishStore(useShallow((state) => {
  return { a: state.a };
}));`,
      errors: [{ messageId: 'shallowRequired' }],
    },
    {
      code: `import { create } from 'zustand';
const { a } = useBearStore((state) => ({ a: state.a }));`,
      output: `import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
const { a } = useBearStore(useShallow((state) => ({ a: state.a })));`,
      errors: [{ messageId: 'shallowRequired' }],
    },
    {
      code: `import { shallow } from 'zustand/shallow';
const { a } = useBearStore((state) => ({ a: state.a }));`,
      output: `import { shallow, useShallow } from 'zustand/shallow';
const { a } = useBearStore(useShallow((state) => ({ a: state.a })));`,
      errors: [{ messageId: 'shallowRequired' }],
    },
    {
      code: `import { useShallow } from 'zustand/react/shallow';
const { a } = useBearStore((state) => ({ a: state.a }));`,
      output: `import { useShallow } from 'zustand/react/shallow';
const { a } = useBearStore(useShallow((state) => ({ a: state.a })));`,
      errors: [{ messageId: 'shallowRequired' }],
    },
    {
      code: `import { create } from 'zustand'
const { a } = useBearStore((state) => ({ a: state.a }))`,
      output: `import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
const { a } = useBearStore(useShallow((state) => ({ a: state.a })))`,
      errors: [{ messageId: 'shallowRequired' }],
    },
    {
      code: 'const { a } = useBearStore((state) => ({ a: state.a }), shallow);',
      output: null,
      errors: [{ messageId: 'shallowRequired' }],
    },
  ],
});

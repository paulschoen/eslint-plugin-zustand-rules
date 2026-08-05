# eslint-plugin-zustand-rules

ESLint rules for [Zustand](https://github.com/pmndrs/zustand). Catches the patterns that cause
unnecessary re-renders, broken reactivity, and stores that outgrow a single file.

Works with Zustand v4 and v5, ESLint 8 and 9, JavaScript and TypeScript.

## Installation

```bash
npm install --save-dev eslint-plugin-zustand-rules
```

```bash
yarn add --dev eslint-plugin-zustand-rules
```

## Usage

### Flat config (ESLint 9, `eslint.config.js`)

```javascript
import zustandRules from 'eslint-plugin-zustand-rules';

export default [...zustandRules.configs['flat/recommended']];
```

To pick rules yourself:

```javascript
import zustandRules from 'eslint-plugin-zustand-rules';

export default [
  {
    plugins: { 'zustand-rules': zustandRules },
    rules: {
      'zustand-rules/no-state-mutation': 'error',
      'zustand-rules/require-shallow-selector': 'error',
    },
  },
];
```

### Legacy config (ESLint 8, `.eslintrc.*`)

```javascript
module.exports = {
  extends: ['plugin:zustand-rules/recommended'],
};
```

TypeScript files need a TypeScript parser so the rules can read `create<State>()(...)` and
`StateCreator<T>` slices:

```javascript
module.exports = {
  extends: ['plugin:zustand-rules/recommended'],
  parser: '@typescript-eslint/parser',
};
```

## What the rules understand

Store detection is bound to the identifiers a file imports from `zustand`, so `Message.create({})`
or `createSelector(...)` from another library never gets mistaken for a store. All of these forms
are recognized:

```typescript
create((set) => ({ ... }))                              // plain
create<State>()((set) => ({ ... }))                     // curried, TypeScript
create<State>()(persist((set) => ({ ... }), { ... }))   // middleware
create<State>()(urlSync({ ... }, (...args) => ({ ... }))) // custom middleware

const createThingSlice: StateCreator<ThingSlice> = (set, get) => ({ ... }) // slice files
```

Files importing immer are skipped by `no-state-mutation`, since mutating a draft is the point of
immer.

## Recommended config

Every rule in `recommended` is `error`. Turn down the ones you want to treat as advisory.

| Rule | Catches | Fixable |
| --- | --- | --- |
| [`no-state-mutation`](#no-state-mutation) | broken reactivity | yes |
| [`require-shallow-selector`](#require-shallow-selector) | wasted re-renders, v5 render loops | no |
| [`use-store-selectors`](#use-store-selectors) | whole-store subscriptions | no |
| [`no-repeated-store-selectors`](#no-repeated-store-selectors) | repeated reads of one store | no |
| [`no-logic-in-selectors`](#no-logic-in-selectors) | derived values inside selectors | no |
| [`enforce-state-before-actions`](#enforce-state-before-actions) | state declared after actions | no |
| [`enforce-slices-when-large-state`](#enforce-slices-when-large-state) | stores that should be split | no |
| [`no-multiple-stores`](#no-multiple-stores) | two stores in one module | no |

## Rules

### `no-state-mutation`

Store state is immutable. Mutating it skips the subscription notification, so components never
re-render. Reports assignments to `state.*` and mutating array methods (`push`, `pop`, `shift`,
`unshift`, `splice`, `sort`, `reverse`, `fill`, `copyWithin`) inside a store or slice. Assignments
are auto-fixable.

🚫 Incorrect:

```javascript
const useStore = create((set) => ({
  bears: 0,
  items: [],
  increment: () => {
    state.bears += 1;
  },
  add: (item) => {
    state.items.push(item);
  },
}));
```

✅ Correct:

```javascript
const useStore = create((set) => ({
  bears: 0,
  items: [],
  increment: () => set((state) => ({ bears: state.bears + 1 })),
  add: (item) => set((state) => ({ items: [...state.items, item] })),
}));
```

### `require-shallow-selector`

A selector that builds a new object or array returns a fresh reference every call, so the component
re-renders on every store change. In v5 it can loop forever. Wrap it in `useShallow`.

🚫 Incorrect:

```javascript
const { bears, fish } = useStore((state) => ({ bears: state.bears, fish: state.fish }));
const [bears, fish] = useStore((state) => [state.bears, state.fish]);
```

✅ Correct:

```javascript
import { useShallow } from 'zustand/react/shallow';

const { bears, fish } = useStore(useShallow((state) => ({ bears: state.bears, fish: state.fish })));
const bears = useStore((state) => state.bears);
```

### `use-store-selectors`

Calling a store hook with no arguments subscribes the component to every state change. Also reports
the equality-function second argument, which v5 removed in favor of `useShallow`.

🚫 Incorrect:

```javascript
const state = useStore();
const bears = useStore((state) => state.bears, shallow);
```

✅ Correct:

```javascript
const bears = useStore((state) => state.bears);
const bears = useStore(selectBears);
```

Any hook matching `^use([A-Z]\w*)?Store$` counts, which covers `useStore`, `useBearStore`,
`useFishStore`, and so on. Override it if your naming differs:

```json
{
  "rules": {
    "zustand-rules/use-store-selectors": ["error", { "storeHookPattern": "^use.*(Store|State)$" }]
  }
}
```

`require-shallow-selector` takes the same option.

### `no-repeated-store-selectors`

Reading the same store hook over and over in one component or hook is noise. Select the values
together with `useShallow` instead. Counts calls per store hook per function, so two different
stores in one component are fine.

🚫 Incorrect:

```javascript
const bears = useBearStore((state) => state.bears);
const fish = useBearStore((state) => state.fish);
const honey = useBearStore((state) => state.honey || state.nuts);
```

✅ Correct:

```javascript
import { useShallow } from 'zustand/react/shallow';

const { bears, fish, honey } = useBearStore(
  useShallow((state) => ({
    bears: state.bears,
    fish: state.fish,
    honey: state.honey || state.nuts,
  })),
);
```

Calls already wrapped in `useShallow` are not counted. Default allows 2 calls to the same hook and
reports at 3. Set `maxCalls` to 1 to require grouping as soon as a second read appears:

```json
{
  "rules": {
    "zustand-rules/no-repeated-store-selectors": ["error", { "maxCalls": 1 }]
  }
}
```

Takes `storeHookPattern` too. This is a readability rule, not a performance fix. Separate atomic
selectors already re-render only on the values they read.

### `no-logic-in-selectors`

A selector should read state, not derive from it. Fallbacks and computation inside a selector get
copy-pasted to every call site, so the rule for what the value means lives in a dozen places instead
of one. Put it in the store, or derive after selecting.

🚫 Incorrect:

```javascript
const honey = useBearStore((state) => state.honey || state.nuts);
const isReady = useBearStore((state) => !state.isLoading);
const keys = useBearStore((state) => Object.keys(state.treats));
```

✅ Correct:

```javascript
const honey = useBearStore((state) => state.honey);

const nuts = useBearStore((state) => state.nuts);
const token = honey || nuts;

const activeToken = useBearStore(selectActiveTreat);
```

Selectors returning an object or array are left to
[`require-shallow-selector`](#require-shallow-selector), and `useShallow`-wrapped selectors are
skipped. Plain reads pass, including optional chaining and dynamic keys: `state.user?.name`,
`state.inputs[id]`.

Worth knowing which half of this is a correctness issue. Coalescing to a string or number is safe,
since zustand compares primitives with `Object.is`, so this rule is about keeping the logic in one
place. Deriving a new object or array (`Object.keys`, `.map`, `.filter`) is a genuine re-render bug,
because the selector returns a fresh reference every call.

Takes `storeHookPattern` too.

### `enforce-state-before-actions`

Group state first, then the actions that update it. Reports state declared after the first action.

🚫 Incorrect:

```javascript
const useStore = create((set) => ({
  bears: 0,
  increment: () => set((state) => ({ bears: state.bears + 1 })),
  fish: 0,
}));
```

✅ Correct:

```javascript
const useStore = create((set) => ({
  bears: 0,
  fish: 0,
  increment: () => set((state) => ({ bears: state.bears + 1 })),
}));
```

### `enforce-slices-when-large-state`

Flags a store or slice with more than `maxProperties` own properties, default 20. Spread properties
are not counted, so a store composed entirely of slices never trips it.

```json
{
  "rules": {
    "zustand-rules/enforce-slices-when-large-state": ["warn", { "maxProperties": 15 }]
  }
}
```

✅ Correct:

```javascript
const createBearSlice = (set) => ({
  bears: 0,
  incrementBears: () => set((state) => ({ bears: state.bears + 1 })),
});

const createFishSlice = (set) => ({
  fish: 0,
  incrementFish: () => set((state) => ({ fish: state.fish + 1 })),
});

const useStore = create((...args) => ({
  ...createBearSlice(...args),
  ...createFishSlice(...args),
}));
```

### `no-multiple-stores`

One store per module. Split state into slices and compose them in a single `create` call instead of
creating a second store. Curried `create<State>()(...)` counts once.

## Migrating from 1.x

- `enforce-use-setstate` is gone. It duplicated `no-state-mutation`, which now carries the autofix.
  Drop it from your config.
- 1.x shipped no rules at all, since the plugin entrypoint exported only `configs`. If
  `plugin:zustand-rules/recommended` appeared to pass, this is why.
- `enforce-slices-when-large-state` now defaults to 20 properties instead of 10, and skips spreads.

## License

MIT, see [LICENSE](LICENSE).

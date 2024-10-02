
# eslint-plugin-zustand-rules

This ESLint plugin helps enforce best practices when using Zustand for state management. It provides rules that encourage consistency, prevent common issues, and promote scalable state management patterns in large applications.

## Installation

Install the plugin using npm or yarn:

```bash
npm install --save-dev eslint-plugin-zustand-rules
```

or

```bash
yarn add --dev eslint-plugin-zustand-rules
```

## Usage

Add the plugin to your ESLint configuration file:

### `.eslintrc.json` example:

```json
{
  "plugins": ["zustand-rules"],
  "extends": ["eslint:recommended", "plugin:zustand-rules/recommended"]
}
```

### `.eslintrc.js` example:

```javascript
module.exports = {
  plugins: ['zustand-rules'],
  extends: ['eslint:recommended', 'plugin:zustand-rules/recommended'],
};
```

## Rules

The plugin contains the following rules:

### `zustand-rules/no-multiple-stores`

**Ensures there is only one Zustand store per module.** Zustand encourages managing the entire global state within a single store, although you can split state into slices for large applications. This rule ensures only one `create` call (store) is used per module.

#### Rule Details

This rule reports an error when more than one `create` function call is found in a module.

#### Examples

🚫 **Incorrect**:

```javascript
// Multiple Zustand stores in a single file
const useStoreA = create((set) => ({
  bears: 0,
}));

const useStoreB = create((set) => ({
  fish: 0,
}));
```

✅ **Correct**:

```javascript
// Single Zustand store in a module
const useStore = create((set) => ({
  bears: 0,
  fish: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
}));
```

### `zustand-rules/use-store-selectors`

**Enforces** the use of selectors when accessing values from Zustand stores to avoid unnecessary re-renders. This improves performance and makes the code more predictable.

#### Rule Details

This rule checks whether `useStore` is used without a selector function.

#### Examples

🚫 **Incorrect**:

```javascript
// Without selector
const state = useStore();
```

✅ **Correct**:

```javascript
// With selector
const bears = useStore((state) => state.bears);
```

### `zustand-rules/no-state-mutation`

**Prevents direct state mutation.** Always use `set` or `setState` to update the store to ensure proper reactivity.

#### Rule Details

This rule reports an error when direct state mutations (e.g., `state.bears += 1`) are detected in store actions.

#### Examples

🚫 **Incorrect**:

```javascript
// Direct mutation of state
const useStore = create((set) => ({
  bears: 0,
  increment: () => {
    state.bears += 1;
  },
}));
```

✅ **Correct**:

```javascript
// Properly using set to update state
const useStore = create((set) => ({
  bears: 0,
  increment: () => set((state) => ({ bears: state.bears + 1 })),
}));
```

### `zustand-rules/enforce-use-setstate`

**Ensures state is updated via `set` or `setState`.** This rule checks that updates to the store's state use the proper functions to ensure proper reactivity and avoid direct state mutations.

#### Rule Details

This rule reports an error if direct state mutations are detected and suggests using `set` or `setState` instead.

#### Examples

🚫 **Incorrect**:

```javascript
// Direct state mutation
const useStore = create(() => ({
  bears: 0,
  setBears: () => {
    state.bears += 1;
  },
}));
```

✅ **Correct**:

```javascript
// Using set to update state
const useStore = create((set) => ({
  bears: 0,
  setBears: () => set((state) => ({ bears: state.bears + 1 })),
}));
```

### `zustand-rules/enforce-state-before-actions`

**Ensures state properties are listed before action functions**. This improves the readability and structure of Zustand stores by ensuring that all state properties are defined before any action functions.

#### Rule Details

This rule reports an error when action functions are defined before state properties.

#### Examples

🚫 **Incorrect**:

```javascript
// Action function before state property
const useStore = create((set) => ({
  increment: () => set(state => ({ bears: state.bears + 1 })),
  bears: 0,
}));
```

✅ **Correct**:

```javascript
// State property before action function
const useStore = create((set) => ({
  bears: 0,
  increment: () => set(state => ({ bears: state.bears + 1 })),
}));
```

### `zustand-rules/enforce-slices-when-large-state`

**Encourages creating slices if the Zustand store state gets too large.** This rule checks the number of properties in the Zustand store and suggests splitting the store into slices if it contains too many properties, improving code modularity and maintainability.

#### Rule Details

This rule enforces the use of slices when the number of state properties exceeds a certain threshold. The default threshold is set to 5 properties, but you can customize this in your ESLint configuration.

#### Examples

🚫 **Incorrect** (Too many properties):

```javascript
// Large Zustand stores make hard to organize and maintain
const useStore = create((set) => ({
  bears: 0,
  fish: 0,
  birds: 0,
  trees: 0,
  plants: 0,
  sky: 0,
  clouds: 0,
  bugs: 0,
  raccoon: 0,
  incrementBears: () => set((state) => ({ bears: state.bears + 1 })),
}));
```

✅ **Correct** (Using slices):

```javascript
// Zustand store with slices allow for better organization and thought separation
const createBearSlice = (set) => ({
  bears: 0,
  incrementBears: () => set((state) => ({ bears: state.bears + 1 })),
});

const createFishSlice = (set) => ({
  fish: 0,
  incrementFish: () => set((state) => ({ fish: state.fish + 1 })),
});

const useStore = create((set) => ({
  ...createBearSlice(set),
  ...createFishSlice(set),
}));
```

#### Recommended Configuration
You can configure the maximum number of properties allowed in a store before suggesting slices:
```json
{
  "rules": {
    "zustand-rules/enforce-slices-when-large-state": ["warn", { "maxProperties": 10 }]
  }
}
```


---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

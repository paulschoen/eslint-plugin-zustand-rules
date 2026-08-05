const {
  DEFAULT_STORE_HOOK_PATTERN,
  getCalleeName,
  getEnclosingFunction,
  isShallowWrapped,
  isStoreHookName,
} = require('../helpers/zustand-helpers');

const DEFAULT_MAX_CALLS = 2;

function collect(callsByScope, node) {
  const scope = getEnclosingFunction(node.parent);
  const hookName = getCalleeName(node.callee);
  const byHook = callsByScope.get(scope) ?? new Map();
  const calls = byHook.get(hookName) ?? [];

  calls.push(node);
  byHook.set(hookName, calls);
  callsByScope.set(scope, byHook);
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow repeated single-property selector calls on the same Zustand store hook. Read them together with useShallow.',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/paulschoen/eslint-plugin-zustand-rules#no-repeated-store-selectors',
    },
    schema: [
      {
        type: 'object',
        properties: {
          maxCalls: {
            type: 'integer',
            minimum: 1,
          },
          storeHookPattern: {
            type: 'string',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      repeatedSelectors:
        '{{hookName}} is read {{count}} separate times here. Select the values together with useShallow from zustand/react/shallow.',
    },
  },
  create(context) {
    const options = context.options[0] ?? {};
    const maxCalls = options.maxCalls ?? DEFAULT_MAX_CALLS;
    const storeHookPattern = options.storeHookPattern ?? DEFAULT_STORE_HOOK_PATTERN;
    const callsByScope = new Map();

    return {
      CallExpression(node) {
        if (!isStoreHookName(getCalleeName(node.callee), storeHookPattern)) return;
        if (node.arguments.length === 0) return;
        if (isShallowWrapped(node.arguments[0])) return;

        collect(callsByScope, node);
      },
      'Program:exit'() {
        callsByScope.forEach((byHook) => {
          byHook.forEach((calls, hookName) => {
            if (calls.length <= maxCalls) return;

            context.report({
              node: calls[0],
              messageId: 'repeatedSelectors',
              data: { hookName, count: calls.length },
            });
          });
        });
      },
    };
  },
};

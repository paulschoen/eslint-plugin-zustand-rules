const {
  DEFAULT_STORE_HOOK_PATTERN,
  getCalleeName,
  getSelectorReturn,
  isFunctionExpression,
  unwrapExpression,
  isStoreHookName,
} = require('../helpers/zustand-helpers');

const UNSTABLE_RETURN_TYPES = new Set(['ObjectExpression', 'ArrayExpression']);

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require useShallow when a Zustand selector builds a new object or array, which otherwise re-renders on every store change.',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/paulschoen/eslint-plugin-zustand-rules#require-shallow-selector',
    },
    schema: [
      {
        type: 'object',
        properties: {
          storeHookPattern: {
            type: 'string',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      shallowRequired:
        'This selector returns a new {{kind}} on every call, so the component re-renders on every store change. Wrap it in useShallow from zustand/react/shallow.',
    },
  },
  create(context) {
    const storeHookPattern = context.options[0]?.storeHookPattern ?? DEFAULT_STORE_HOOK_PATTERN;

    return {
      CallExpression(node) {
        if (!isStoreHookName(getCalleeName(node.callee), storeHookPattern)) return;

        const selector = unwrapExpression(node.arguments[0]);

        if (!selector || !isFunctionExpression(selector)) return;

        const returned = getSelectorReturn(selector);

        if (!returned || !UNSTABLE_RETURN_TYPES.has(returned.type)) return;

        context.report({
          node: selector,
          messageId: 'shallowRequired',
          data: { kind: returned.type === 'ArrayExpression' ? 'array' : 'object' },
        });
      },
    };
  },
};

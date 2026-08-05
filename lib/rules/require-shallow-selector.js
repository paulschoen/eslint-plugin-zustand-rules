const {
  DEFAULT_STORE_HOOK_PATTERN,
  getSelectorReturn,
  getShallowImportFixes,
  getUnqualifiedCalleeName,
  isFunctionExpression,
  isStoreHookName,
  unwrapExpression,
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
    fixable: 'code',
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
    const sourceCode = context.sourceCode ?? context.getSourceCode();

    return {
      CallExpression(node) {
        if (!isStoreHookName(getUnqualifiedCalleeName(node.callee), storeHookPattern)) return;

        const [firstArgument] = node.arguments;
        const selector = unwrapExpression(firstArgument);

        if (!selector || !isFunctionExpression(selector)) return;

        const returned = getSelectorReturn(selector);

        if (!returned || !UNSTABLE_RETURN_TYPES.has(returned.type)) return;

        const wrap = (fixer) => [
          fixer.insertTextBefore(firstArgument, 'useShallow('),
          fixer.insertTextAfter(firstArgument, ')'),
          ...getShallowImportFixes(sourceCode, fixer),
        ];

        context.report({
          node: selector,
          messageId: 'shallowRequired',
          data: { kind: returned.type === 'ArrayExpression' ? 'array' : 'object' },
          fix: node.arguments.length === 1 ? wrap : undefined,
        });
      },
    };
  },
};

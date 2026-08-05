const {
  DEFAULT_STORE_HOOK_PATTERN,
  getShallowImportFixes,
  getUnqualifiedCalleeName,
  isFunctionExpression,
  isStoreHookName,
  unwrapExpression,
} = require('../helpers/zustand-helpers');

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Require a selector when reading from a Zustand store hook so components only re-render on the state they use.',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/paulschoen/eslint-plugin-zustand-rules#use-store-selectors',
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
      selectorRequired:
        'Pass a selector to {{hookName}}. Calling it with no arguments subscribes the component to every state change.',
      equalityFnRemoved:
        'Zustand v5 removed the equality-function argument. Wrap the selector in useShallow from zustand/react/shallow instead.',
    },
  },
  create(context) {
    const storeHookPattern = context.options[0]?.storeHookPattern ?? DEFAULT_STORE_HOOK_PATTERN;
    const sourceCode = context.sourceCode ?? context.getSourceCode();

    const replaceEqualityFnWithShallow = (selector, equalityFn) => (fixer) => {
      const trailingToken = sourceCode.getTokenAfter(equalityFn);
      const end = trailingToken.value === ',' ? trailingToken.range[1] : equalityFn.range[1];

      return [
        fixer.insertTextBefore(selector, 'useShallow('),
        fixer.replaceTextRange([selector.range[1], end], ')'),
        ...getShallowImportFixes(sourceCode, fixer),
      ];
    };

    return {
      CallExpression(node) {
        const hookName = getUnqualifiedCalleeName(node.callee);

        if (!isStoreHookName(hookName, storeHookPattern)) return;

        if (node.arguments.length === 0) {
          context.report({ node, messageId: 'selectorRequired', data: { hookName } });
          return;
        }

        const [firstArgument, equalityFn] = node.arguments;

        if (node.arguments.length > 1 && isFunctionExpression(unwrapExpression(firstArgument))) {
          context.report({
            node: equalityFn,
            messageId: 'equalityFnRemoved',
            fix:
              node.arguments.length === 2
                ? replaceEqualityFnWithShallow(firstArgument, equalityFn)
                : undefined,
          });
        }
      },
    };
  },
};

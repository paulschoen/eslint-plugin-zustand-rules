const {
  DEFAULT_STORE_HOOK_PATTERN,
  getSelectorReturn,
  getUnqualifiedCalleeName,
  isFunctionExpression,
  isShallowWrapped,
  isStoreHookName,
  unwrapExpression,
} = require('../helpers/zustand-helpers');

const SHALLOW_OWNED_TYPES = new Set(['ObjectExpression', 'ArrayExpression']);

function isPlainStateRead(node, stateName) {
  const expression = unwrapExpression(node);

  if (!expression) return false;
  if (expression.type === 'Identifier') return expression.name === stateName;
  if (expression.type === 'ChainExpression') {
    return isPlainStateRead(expression.expression, stateName);
  }
  if (expression.type === 'MemberExpression') {
    return isPlainStateRead(expression.object, stateName);
  }
  return false;
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Keep Zustand selectors to plain state reads. Derive values in the store or after selecting, not inside the selector.',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/paulschoen/eslint-plugin-zustand-rules#no-logic-in-selectors',
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
      logicInSelector:
        'Selector derives a value instead of reading state. Move the fallback or computation into the store, or derive it after selecting, so the logic lives in one place.',
    },
  },
  create(context) {
    const storeHookPattern = context.options[0]?.storeHookPattern ?? DEFAULT_STORE_HOOK_PATTERN;

    return {
      CallExpression(node) {
        if (!isStoreHookName(getUnqualifiedCalleeName(node.callee), storeHookPattern)) return;

        const [firstArgument] = node.arguments;

        if (!firstArgument || isShallowWrapped(firstArgument)) return;

        const selector = unwrapExpression(firstArgument);

        if (!isFunctionExpression(selector)) return;

        const [stateParam] = selector.params;

        if (stateParam?.type !== 'Identifier') return;

        const returned = getSelectorReturn(selector);

        if (!returned) return;
        if (SHALLOW_OWNED_TYPES.has(returned.type)) return;
        if (isPlainStateRead(returned, stateParam.name)) return;

        context.report({ node: returned, messageId: 'logicInSelector' });
      },
    };
  },
};

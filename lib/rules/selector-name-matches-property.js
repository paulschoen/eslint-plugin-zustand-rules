const {
  DEFAULT_STORE_HOOK_PATTERN,
  getSelectorReturn,
  getUnqualifiedCalleeName,
  isFunctionExpression,
  isShallowWrapped,
  isStoreHookName,
  unwrapExpression,
} = require('../helpers/zustand-helpers');

function getSelectedPropertyName(returned, stateName) {
  const expression = unwrapExpression(returned);

  if (expression?.type === 'ChainExpression') {
    return getSelectedPropertyName(expression.expression, stateName);
  }
  if (expression?.type !== 'MemberExpression') return undefined;
  if (expression.computed || expression.property.type !== 'Identifier') return undefined;

  const root = getRootName(expression.object);

  return root === stateName ? expression.property.name : undefined;
}

function getRootName(node) {
  const expression = unwrapExpression(node);

  if (expression?.type === 'Identifier') return expression.name;
  if (expression?.type === 'ChainExpression') return getRootName(expression.expression);
  if (expression?.type === 'MemberExpression') return getRootName(expression.object);
  return undefined;
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Require the variable holding a single-property Zustand selector to be named after the property it selects.',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/paulschoen/eslint-plugin-zustand-rules#selector-name-matches-property',
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
      nameMismatch:
        '"{{name}}" is selected from "{{property}}". Name it after the property it reads, or rename the property, so a copy-pasted selector cannot silently read the wrong value.',
    },
  },
  create(context) {
    const storeHookPattern = context.options[0]?.storeHookPattern ?? DEFAULT_STORE_HOOK_PATTERN;

    return {
      CallExpression(node) {
        if (!isStoreHookName(getUnqualifiedCalleeName(node.callee), storeHookPattern)) return;
        if (node.arguments.length !== 1) return;
        if (isShallowWrapped(node.arguments[0])) return;

        const declarator = node.parent;

        if (declarator?.type !== 'VariableDeclarator' || declarator.init !== node) return;
        if (declarator.id.type !== 'Identifier') return;

        const selector = unwrapExpression(node.arguments[0]);

        if (!isFunctionExpression(selector)) return;
        if (selector.params.length !== 1 || selector.params[0].type !== 'Identifier') return;

        const property = getSelectedPropertyName(
          getSelectorReturn(selector),
          selector.params[0].name
        );

        if (!property || property === declarator.id.name) return;

        context.report({
          node: declarator.id,
          messageId: 'nameMismatch',
          data: { name: declarator.id.name, property },
        });
      },
    };
  },
};

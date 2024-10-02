module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Encourage creating slices if the Zustand store state gets too large.',
      category: 'Best Practices',
      recommended: false,
    },
    schema: [
      {
        type: 'object',
        properties: {
          maxProperties: {
            type: 'integer',
            default: 10,
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    let isZustandCreate = false;

    const maxProperties = context.options[0]?.maxProperties || 10;

    return {
      ImportDeclaration(node) {
        if (node.source.value === 'zustand') {
          isZustandCreate = node.specifiers.some(specifier => specifier.local.name === 'create');
        }
      },
      CallExpression(node) {
        if (isZustandCreate && node.arguments.length > 0) {
          const argument = node.arguments[0];

          if (argument.type === 'ArrowFunctionExpression' && argument.body.type === 'ObjectExpression') {
            const properties = argument.body.properties;

            if (properties.length > maxProperties) {
              context.report({
                node,
                message: `The Zustand store contains more than ${maxProperties} properties. Consider splitting the store into slices.`,
              });
            }
          }
        }
      },
    };
  },
};

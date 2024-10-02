module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Colocate actions inside Zustand store definition and ensure actions use set or setState',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
  },
  create(context) {
    return {
      CallExpression(node) {
        if (
          node.callee.name === 'create' &&
          node.arguments.length > 0 &&
          node.arguments[0].type === 'ArrowFunctionExpression' &&
          node.arguments[0].body &&
          node.arguments[0].body.type === 'ObjectExpression' &&
          Array.isArray(node.arguments[0].body.properties)
        ) {
          const properties = node.arguments[0].body.properties;

          properties.forEach((property) => {
            if (['ArrowFunctionExpression', 'FunctionExpression'].includes(property.value.type)) {
              const functionBody = property.value.body;

              if (functionBody.type === 'BlockStatement') {
                const hasSetCall = functionBody.body.some(bodyNode =>
                  bodyNode.type === 'ExpressionStatement' &&
                  bodyNode.expression.callee &&
                  ['set', 'setState'].includes(bodyNode.expression.callee.name)
                );

                if (!hasSetCall) {
                  context.report({
                    node: property,
                    loc: property.loc,
                    message: 'Store action must use set or setState.',
                  });
                }
              } else if (functionBody.type === 'CallExpression') {
                if (!['set', 'setState'].includes(functionBody.callee.name)) {
                  context.report({
                    node: property,
                    loc: property.loc,
                    message: 'Store action must use set or setState.',
                  });
                }
              }
            }
          });
        }
      },
    };
  },
};
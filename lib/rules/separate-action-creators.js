module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Ensure action creators are separated from the state logic in Zustand stores.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
  },
  create(context) {
    return {
      VariableDeclarator(node) {
        if (
          node.id &&
          node.id.name &&
          node.id.name.startsWith('set') &&
          (node.init.type === 'ArrowFunctionExpression' ||
            node.init.type === 'FunctionExpression')
        ) {
          const functionBody = node.init.body;
          if (functionBody.type === 'BlockStatement') {
            const hasStateMutation = functionBody.body.some((statement) => {
              return (
                statement.type === 'ExpressionStatement' &&
                statement.expression.type === 'AssignmentExpression' &&
                statement.expression.left.type === 'MemberExpression' &&
                statement.expression.left.object.name === 'state'
              );
            });

            if (hasStateMutation) {
              context.report({
                node,
                message:
                  'Action creators should be separated from the store state to follow Flux architecture.',
              });
            }
          }
        }
      },
    };
  },
};

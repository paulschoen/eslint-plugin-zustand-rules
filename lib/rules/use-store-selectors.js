module.exports = {
    meta: {
      type: 'suggestion',
      docs: {
        description: 'Ensure selectors are used with useStore to improve performance.',
        category: 'Best Practices',
        recommended: true,
      },
      schema: [],
    },
    create(context) {
      return {
        CallExpression(node) {
          if (node.callee.name === 'useStore') {
            const args = node.arguments;
  
            if (args.length === 0 || args.length > 1) {
              context.report({
                node,
                message: 'You should use selectors when calling useStore to improve performance.',
              });
            }
          }
        }
      };
    }
  };
  
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Ensure there is only a single Zustand store per module',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
  },
  create(context) {
    let storeCount = 0;

    return {
      CallExpression(node) {
        if (node.callee.name === 'create') {
          storeCount++;

          if (storeCount > 1) {
            context.report({
              node,
              message: 'Multiple Zustand stores detected. Only one store should be used per module.',
            });
          }
        }
      },
    };
  },
};

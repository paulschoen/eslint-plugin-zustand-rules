module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Prevent direct mutation of the store state in Zustand stores.',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [],
  },
  create(context) {
    return {
      AssignmentExpression(node) {
        if (
          node.left.type === 'MemberExpression' &&
          node.left.object.name === 'state'
        ) {
          context.report({
            node,
            message:
              'Direct mutation of state is not allowed. Use setState or an action creator.',
          });
        }
      },
      CallExpression(node) {
        if (
          node.callee &&
          node.callee.type === 'MemberExpression' &&
          node.callee.object &&
          node.callee.object.type === 'MemberExpression' &&
          node.callee.object.object &&
          node.callee.object.object.name === 'state' &&
          ['push', 'pop', 'shift', 'unshift', 'splice'].includes(
            node.callee.property.name
          )
        ) {
          context.report({
            node,
            message:
              'Direct array mutations on state are not allowed. Use setState or an action creator.',
          });
        }
      },
    };
  },
};

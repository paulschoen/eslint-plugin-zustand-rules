module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ensure store updates only use set or setState',
      category: 'Best Practices',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
  },
  create(context) {
    const sourceCode = context.getSourceCode();
    let isZustandCreate = false;

    return {
      ImportDeclaration(node) {
        if (node.source.value === 'zustand') {
          isZustandCreate = node.specifiers.some(
            (specifier) => specifier.local.name === 'create'
          );
        }
      },
      CallExpression(node) {
        if (!isZustandCreate || node.callee.name !== 'create') {
          return;
        }

        if (node.arguments.length > 0 && node.arguments[0].type === 'ArrowFunctionExpression') {
          const arrowFunctionBody = node.arguments[0].body;

          if (arrowFunctionBody.type === 'ObjectExpression') {
            arrowFunctionBody.properties.forEach((property) => {
              if (property.value && property.value.type === 'ArrowFunctionExpression') {
                const functionBody = property.value.body;

                const bodyNodes = functionBody.type === 'BlockStatement' ? functionBody.body : [functionBody];

                bodyNodes.forEach((bodyNode) => {
                  if (bodyNode.type === 'ExpressionStatement' && bodyNode.expression.type === 'AssignmentExpression') {
                    const assignmentNode = bodyNode.expression;

                    if (assignmentNode.left.optional) {
                      return;
                    }

                    if (assignmentNode.left.object && assignmentNode.left.object.name === 'state') {
                      const propertyName = assignmentNode.left.computed
                        ? sourceCode.getText(assignmentNode.left.property)
                        : assignmentNode.left.property.name;
                      const rightHandText = sourceCode.getText(assignmentNode.right);
                      const propertyValueWithoutQuotes = propertyName.replace(/'/g, '');
                      const operator = assignmentNode.operator;
                      let setStateCall;

                      if (['+=', '-=', '*=', '/=', '%='].includes(operator)) {
                        const operatorSymbol = operator[0];
                        setStateCall = `set((state) => ({ ${propertyValueWithoutQuotes}: state.${propertyValueWithoutQuotes} ${operatorSymbol} ${rightHandText} }))`;
                      } else {
                        setStateCall = `set((state) => ({ ${propertyValueWithoutQuotes}: ${rightHandText} }))`;
                      }

                      context.report({
                        node: assignmentNode,
                        message: 'Direct state mutation detected. Use set or setState for store updates.',
                        fix(fixer) {
                          return fixer.replaceText(assignmentNode, setStateCall);
                        },
                      });
                    }
                  }
                });
              }
            });
          }
        }
      },
    };
  },
};

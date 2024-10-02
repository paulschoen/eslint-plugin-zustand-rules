module.exports = {
    meta: {
        type: 'suggestion',
        docs: {
            description: 'Ensure Zustand state properties are listed before action functions',
            category: 'Best Practices',
            recommended: false,
        },
        schema: [],
        messages: {
            stateBeforeActions: 'State properties should be listed before action functions.',
        },
    },
    create(context) {
        let isZustandCreate = false;

        return {
            ImportDeclaration(node) {
                if (node.source.value === 'zustand') {
                    isZustandCreate = node.specifiers.some(specifier => specifier.local.name === 'create');
                }
            },
            CallExpression(node) {
                if (!isZustandCreate || node.callee.name !== 'create') {
                    return;
                }

                if (node.arguments.length > 0 && node.arguments[0].type === 'ArrowFunctionExpression') {
                    const storeObject = node.arguments[0].body;

                    if (storeObject.type === 'ObjectExpression') {
                        let foundAction = false;
                        storeObject.properties.forEach((property) => {
                            const isFunction = property.value.type === 'ArrowFunctionExpression' || property.value.type === 'FunctionExpression';

                            if (isFunction) {
                                foundAction = true;
                            } else if (foundAction) {
                                context.report({
                                    node: property,
                                    messageId: 'stateBeforeActions',
                                });
                            }
                        });
                    }
                }
            },
        };
    },
};

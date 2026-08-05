const {
  createZustandContext,
  getStateObject,
  isActionProperty,
  isStateProperty,
} = require('../helpers/zustand-helpers');

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require Zustand state properties to be declared before action functions.',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/paulschoen/eslint-plugin-zustand-rules#enforce-state-before-actions',
    },
    schema: [],
    messages: {
      stateBeforeActions:
        'State property "{{propertyName}}" is declared after an action. Group state before actions.',
    },
  },
  create(context) {
    const zustand = createZustandContext(context);

    if (!zustand.hasZustandImport) return {};

    return {
      ':function'(node) {
        if (!zustand.isStateCreator(node)) return;

        const stateObject = getStateObject(node);

        if (!stateObject) return;

        const firstActionIndex = stateObject.properties.findIndex(isActionProperty);

        if (firstActionIndex === -1) return;

        stateObject.properties
          .slice(firstActionIndex + 1)
          .filter(isStateProperty)
          .forEach((property) => {
            context.report({
              node: property,
              messageId: 'stateBeforeActions',
              data: { propertyName: zustand.sourceCode.getText(property.key) },
            });
          });
      },
    };
  },
};

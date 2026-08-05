const { createZustandContext, getStateObject } = require('../helpers/zustand-helpers');

const DEFAULT_MAX_PROPERTIES = 20;

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Encourage splitting a Zustand store into slices once its state grows large.',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/paulschoen/eslint-plugin-zustand-rules#enforce-slices-when-large-state',
    },
    schema: [
      {
        type: 'object',
        properties: {
          maxProperties: {
            type: 'integer',
            minimum: 1,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      tooManyProperties:
        'This store defines {{count}} properties (max {{max}}). Split it into slices composed in a single create call.',
    },
  },
  create(context) {
    const zustand = createZustandContext(context);

    if (!zustand.hasZustandImport) return {};

    const maxProperties = context.options[0]?.maxProperties ?? DEFAULT_MAX_PROPERTIES;

    return {
      ':function'(node) {
        if (!zustand.isStateCreator(node)) return;

        const stateObject = getStateObject(node);

        if (!stateObject) return;

        const ownProperties = stateObject.properties.filter(
          (property) => property.type === 'Property'
        );

        if (ownProperties.length <= maxProperties) return;

        context.report({
          node: stateObject,
          messageId: 'tooManyProperties',
          data: { count: ownProperties.length, max: maxProperties },
        });
      },
    };
  },
};

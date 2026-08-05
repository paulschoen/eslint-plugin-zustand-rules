const { createZustandContext } = require('../helpers/zustand-helpers');

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow more than one Zustand store per module.',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/paulschoen/eslint-plugin-zustand-rules#no-multiple-stores',
    },
    schema: [],
    messages: {
      multipleStores:
        'A second Zustand store is created in this module. Keep one store per module and compose state with slices.',
    },
  },
  create(context) {
    const zustand = createZustandContext(context);

    if (!zustand.hasZustandImport) return {};

    const stores = [];

    return {
      CallExpression(node) {
        if (!zustand.isStoreCreation(node)) return;

        stores.push(node);

        if (stores.length > 1) {
          context.report({ node, messageId: 'multipleStores' });
        }
      },
    };
  },
};

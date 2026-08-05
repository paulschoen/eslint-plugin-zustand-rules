const {
  createZustandContext,
  getStateObject,
  isActionProperty,
  isStateProperty,
} = require('../helpers/zustand-helpers');

function getIndentBefore(node, sourceCode) {
  const line = sourceCode.lines[node.loc.start.line - 1];
  return /^\s*/u.exec(line)[0];
}

function canMove(property, sourceCode) {
  return (
    sourceCode.getCommentsBefore(property).length === 0 &&
    sourceCode.getCommentsAfter(property).length === 0
  );
}

function buildMoveFix(property, destination, sourceCode) {
  const trailingToken = sourceCode.getTokenAfter(property);
  const end = trailingToken.value === ',' ? trailingToken.range[1] : property.range[1];
  const indent = getIndentBefore(destination, sourceCode);

  return (fixer) => [
    fixer.insertTextBefore(destination, `${sourceCode.getText(property)},\n${indent}`),
    fixer.removeRange([sourceCode.getTokenBefore(property).range[1], end]),
  ];
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require Zustand state properties to be declared before action functions.',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/paulschoen/eslint-plugin-zustand-rules#enforce-state-before-actions',
    },
    fixable: 'code',
    schema: [],
    messages: {
      stateBeforeActions:
        'State property "{{propertyName}}" is declared after an action. Group state before actions.',
    },
  },
  create(context) {
    const zustand = createZustandContext(context);

    if (!zustand.hasZustandImport) return {};

    const { sourceCode } = zustand;

    return {
      ':function'(node) {
        if (!zustand.isStateCreator(node)) return;

        const stateObject = getStateObject(node);

        if (!stateObject) return;

        const firstActionIndex = stateObject.properties.findIndex(isActionProperty);

        if (firstActionIndex === -1) return;

        const firstAction = stateObject.properties[firstActionIndex];
        const hasSpread = stateObject.properties.some(
          (property) => property.type === 'SpreadElement'
        );

        stateObject.properties
          .slice(firstActionIndex + 1)
          .filter(isStateProperty)
          .forEach((property) => {
            const movable = !hasSpread && canMove(property, sourceCode) && canMove(firstAction, sourceCode);

            context.report({
              node: property,
              messageId: 'stateBeforeActions',
              data: { propertyName: sourceCode.getText(property.key) },
              fix: movable ? buildMoveFix(property, firstAction, sourceCode) : undefined,
            });
          });
      },
    };
  },
};

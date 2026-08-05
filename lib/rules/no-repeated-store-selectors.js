const {
  DEFAULT_STORE_HOOK_PATTERN,
  getEnclosingFunction,
  getSelectorReturn,
  getShallowImportFixes,
  getUnqualifiedCalleeName,
  isFunctionExpression,
  isShallowWrapped,
  isStoreHookName,
  unwrapExpression,
} = require('../helpers/zustand-helpers');

const DEFAULT_MAX_CALLS = 2;

function collect(callsByScope, node) {
  const scope = getEnclosingFunction(node.parent);
  const hookName = getUnqualifiedCalleeName(node.callee);
  const byHook = callsByScope.get(scope) ?? new Map();
  const calls = byHook.get(hookName) ?? [];

  calls.push(node);
  byHook.set(hookName, calls);
  callsByScope.set(scope, byHook);
}

function readsOnlyState(node, stateName) {
  const expression = unwrapExpression(node);

  if (expression?.type === 'Identifier') return expression.name === stateName;
  if (expression?.type === 'ChainExpression') {
    return readsOnlyState(expression.expression, stateName);
  }
  if (expression?.type === 'MemberExpression') {
    return !expression.computed && readsOnlyState(expression.object, stateName);
  }
  return false;
}

function getStatePath(call, sourceCode) {
  const selector = unwrapExpression(call.arguments[0]);

  if (!selector || !isFunctionExpression(selector)) return undefined;
  if (selector.params.length !== 1) return undefined;

  const [stateParam] = selector.params;

  if (stateParam.type !== 'Identifier') return undefined;

  const returned = getSelectorReturn(selector);

  if (!returned || returned.type !== 'MemberExpression') return undefined;
  if (!readsOnlyState(returned, stateParam.name)) return undefined;

  return sourceCode.getText(returned).slice(stateParam.name.length);
}

const MERGE_HOST_TYPES = new Set(['BlockStatement', 'Program']);

function getMergeableDeclaration(call, sourceCode) {
  const declarator = call.parent;

  if (declarator?.type !== 'VariableDeclarator' || declarator.init !== call) return undefined;
  if (declarator.id.type !== 'Identifier') return undefined;
  if (call.arguments.length !== 1) return undefined;

  const declaration = declarator.parent;

  if (declaration.kind !== 'const' || declaration.declarations.length !== 1) return undefined;
  if (!MERGE_HOST_TYPES.has(declaration.parent.type)) return undefined;
  if (sourceCode.getCommentsBefore(declaration).length > 0) return undefined;
  if (sourceCode.getCommentsAfter(declaration).length > 0) return undefined;

  const statePath = getStatePath(call, sourceCode);

  const typeArguments = call.typeArguments ?? call.typeParameters;
  const callee =
    sourceCode.getText(call.callee) + (typeArguments ? sourceCode.getText(typeArguments) : '');

  return statePath ? { declaration, callee, name: declarator.id.name, statePath } : undefined;
}

function buildMergeFix(calls, sourceCode) {
  const merged = calls.map((call) => getMergeableDeclaration(call, sourceCode));

  if (merged.some((entry) => !entry)) return undefined;

  const [first, ...rest] = merged;

  if (merged.some((entry) => entry.declaration.parent !== first.declaration.parent)) {
    return undefined;
  }
  if (merged.some((entry) => entry.callee !== first.callee)) return undefined;

  const names = merged.map((entry) => entry.name).join(', ');
  const picks = merged.map((entry) => `${entry.name}: state${entry.statePath}`).join(', ');
  const replacement = `const { ${names} } = ${first.callee}(useShallow((state) => ({ ${picks} })));`;

  return (fixer) => [
    fixer.replaceText(first.declaration, replacement),
    ...rest.map((entry) =>
      fixer.removeRange([
        sourceCode.getTokenBefore(entry.declaration).range[1],
        entry.declaration.range[1],
      ])
    ),
    ...getShallowImportFixes(sourceCode, fixer),
  ];
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow repeated single-property selector calls on the same Zustand store hook. Read them together with useShallow.',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/paulschoen/eslint-plugin-zustand-rules#no-repeated-store-selectors',
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          maxCalls: {
            type: 'integer',
            minimum: 1,
          },
          storeHookPattern: {
            type: 'string',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      repeatedSelectors:
        '{{hookName}} is read {{count}} separate times here. Select the values together with useShallow from zustand/react/shallow.',
    },
  },
  create(context) {
    const options = context.options[0] ?? {};
    const maxCalls = options.maxCalls ?? DEFAULT_MAX_CALLS;
    const storeHookPattern = options.storeHookPattern ?? DEFAULT_STORE_HOOK_PATTERN;
    const sourceCode = context.sourceCode ?? context.getSourceCode();
    const callsByScope = new Map();

    return {
      CallExpression(node) {
        if (!isStoreHookName(getUnqualifiedCalleeName(node.callee), storeHookPattern)) return;
        if (node.arguments.length === 0) return;
        if (isShallowWrapped(node.arguments[0])) return;

        collect(callsByScope, node);
      },
      'Program:exit'() {
        callsByScope.forEach((byHook) => {
          byHook.forEach((calls, hookName) => {
            if (calls.length <= maxCalls) return;

            context.report({
              node: calls[0],
              messageId: 'repeatedSelectors',
              data: { hookName, count: calls.length },
              fix: buildMergeFix(calls, sourceCode),
            });
          });
        });
      },
    };
  },
};

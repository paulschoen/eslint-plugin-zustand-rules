const { createZustandContext } = require('../helpers/zustand-helpers');

const MUTATING_ARRAY_METHODS = new Set([
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse',
  'fill',
  'copyWithin',
]);
const SPREADABLE_ARRAY_METHODS = new Map([
  ['push', 'append'],
  ['unshift', 'prepend'],
]);
const STATE_OBJECT_NAMES = new Set(['state', 'draft']);
const PRECEDENCE_SAFE_TYPES = new Set([
  'Literal',
  'Identifier',
  'MemberExpression',
  'CallExpression',
  'TemplateLiteral',
  'ThisExpression',
  'ArrayExpression',
  'ObjectExpression',
]);
const IDENTIFIER_PATTERN = /^[A-Za-z_$][\w$]*$/u;

function getRootObject(node) {
  return node.type === 'MemberExpression' ? getRootObject(node.object) : node;
}

function targetsStateObject(memberExpression) {
  const root = getRootObject(memberExpression);
  return root.type === 'Identifier' && STATE_OBJECT_NAMES.has(root.name);
}

function getPropertyName(memberExpression) {
  if (!memberExpression.computed) {
    return memberExpression.property.type === 'Identifier'
      ? memberExpression.property.name
      : undefined;
  }
  const { property } = memberExpression;
  return property.type === 'Literal' && typeof property.value === 'string'
    ? property.value
    : undefined;
}

function getSetterName(stateCreator) {
  const [firstParam] = stateCreator.params;
  return firstParam?.type === 'Identifier' ? firstParam.name : undefined;
}

function toPrecedenceSafeOperand(node, sourceCode) {
  const text = sourceCode.getText(node);
  return PRECEDENCE_SAFE_TYPES.has(node.type) ? text : `(${text})`;
}

function buildSetCall(assignment, zustand) {
  const setterName = getSetterName(zustand.getEnclosingStateCreator(assignment));
  const propertyName = getPropertyName(assignment.left);

  if (!setterName || !propertyName) return undefined;
  if (assignment.left.object.type !== 'Identifier') return undefined;

  const stateName = assignment.left.object.name;
  const isPlainIdentifier = IDENTIFIER_PATTERN.test(propertyName);
  const key = isPlainIdentifier ? propertyName : JSON.stringify(propertyName);
  const accessor = isPlainIdentifier
    ? `${stateName}.${propertyName}`
    : `${stateName}[${JSON.stringify(propertyName)}]`;
  const isCompound = assignment.operator !== '=';
  const nextValue = isCompound
    ? `${accessor} ${assignment.operator.slice(0, -1)} ${toPrecedenceSafeOperand(assignment.right, zustand.sourceCode)}`
    : zustand.sourceCode.getText(assignment.right);

  const readsState = zustand.sourceCode
    .getTokens(assignment.right)
    .some((token) => token.type === 'Identifier' && token.value === stateName);

  if (isCompound || readsState) {
    return `${setterName}((${stateName}) => ({ ${key}: ${nextValue} }))`;
  }

  return `${setterName}({ ${key}: ${nextValue} })`;
}

function buildSpreadCall(call, zustand) {
  if (call.parent.type !== 'ExpressionStatement') return undefined;

  const target = call.callee.object;
  const method = call.callee.property.name;
  const spreadOrder = SPREADABLE_ARRAY_METHODS.get(method);

  if (!spreadOrder) return undefined;
  if (target.object.type !== 'Identifier') return undefined;

  const setterName = getSetterName(zustand.getEnclosingStateCreator(call));
  const propertyName = getPropertyName(target);

  if (!setterName || !propertyName || !IDENTIFIER_PATTERN.test(propertyName)) return undefined;

  const stateName = target.object.name;
  const added = call.arguments.map((argument) => zustand.sourceCode.getText(argument));
  const existing = `...${stateName}.${propertyName}`;
  const elements = spreadOrder === 'append' ? [existing, ...added] : [...added, existing];

  return `${setterName}((${stateName}) => ({ ${propertyName}: [${elements.join(', ')}] }))`;
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow direct mutation of Zustand store state; update it through set or setState instead.',
      category: 'Best Practices',
      recommended: true,
      url: 'https://github.com/paulschoen/eslint-plugin-zustand-rules#no-state-mutation',
    },
    fixable: 'code',
    schema: [],
    messages: {
      assignment:
        'Direct state mutation detected. Return a new object from set or setState instead.',
      arrayMutation:
        'Direct array mutation on state detected. Return a new array from set or setState instead.',
    },
  },
  create(context) {
    const zustand = createZustandContext(context);

    if (!zustand.hasZustandImport || zustand.usesImmer) return {};

    return {
      AssignmentExpression(node) {
        if (node.left.type !== 'MemberExpression') return;
        if (node.left.optional) return;
        if (!targetsStateObject(node.left)) return;
        if (!zustand.getEnclosingStateCreator(node)) return;

        const setCall = buildSetCall(node, zustand);

        context.report({
          node,
          messageId: 'assignment',
          fix: setCall ? (fixer) => fixer.replaceText(node, setCall) : undefined,
        });
      },
      CallExpression(node) {
        if (node.callee.type !== 'MemberExpression') return;
        if (node.callee.property.type !== 'Identifier') return;
        if (!MUTATING_ARRAY_METHODS.has(node.callee.property.name)) return;
        if (node.callee.object.type !== 'MemberExpression') return;
        if (!targetsStateObject(node.callee.object)) return;
        if (!zustand.getEnclosingStateCreator(node)) return;

        const spreadCall = buildSpreadCall(node, zustand);

        context.report({
          node,
          messageId: 'arrayMutation',
          fix: spreadCall ? (fixer) => fixer.replaceText(node, spreadCall) : undefined,
        });
      },
    };
  },
};

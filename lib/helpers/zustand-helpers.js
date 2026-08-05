const CREATE_IMPORT_NAMES = new Set(['create', 'createStore', 'createWithEqualityFn']);
const SET_PARAM_NAMES = new Set(['set', 'setState']);
const ZUSTAND_MODULE_PATTERN = /^zustand(?:\/|$)/u;
const DEFAULT_STORE_HOOK_PATTERN = '^use([A-Z]\\w*)?Store$';

function findAncestor(node, predicate) {
  if (!node) return undefined;
  if (predicate(node)) return node;
  return findAncestor(node.parent, predicate);
}

function getCalleeName(callee) {
  if (!callee) return undefined;
  if (callee.type === 'Identifier') return callee.name;
  if (callee.type === 'MemberExpression') return getCalleeName(callee.property);
  if (callee.type === 'CallExpression') return getCalleeName(callee.callee);
  if (callee.type === 'TSInstantiationExpression') return getCalleeName(callee.expression);
  if (callee.type === 'TSNonNullExpression') return getCalleeName(callee.expression);
  return undefined;
}

function getUnqualifiedCalleeName(callee) {
  return callee?.type === 'MemberExpression' ? undefined : getCalleeName(callee);
}

function isFunctionExpression(node) {
  return node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression';
}

function unwrapExpression(node) {
  if (node?.type === 'TSAsExpression' || node?.type === 'TSSatisfiesExpression') {
    return unwrapExpression(node.expression);
  }
  return node;
}

function getSourceCode(context) {
  return context.sourceCode ?? context.getSourceCode();
}

function getZustandImports(sourceCode) {
  return sourceCode.ast.body.filter(
    (statement) =>
      statement.type === 'ImportDeclaration' &&
      ZUSTAND_MODULE_PATTERN.test(statement.source.value)
  );
}

function isCreateSpecifier(specifier) {
  if (specifier.type === 'ImportDefaultSpecifier') return true;
  return (
    specifier.type === 'ImportSpecifier' &&
    specifier.imported.type === 'Identifier' &&
    CREATE_IMPORT_NAMES.has(specifier.imported.name)
  );
}

function getCreateBindings(sourceCode) {
  return new Set(
    getZustandImports(sourceCode)
      .filter((statement) => statement.importKind !== 'type')
      .flatMap((statement) => statement.specifiers)
      .filter(isCreateSpecifier)
      .map((specifier) => specifier.local.name)
  );
}

function importsZustand(sourceCode) {
  return getZustandImports(sourceCode).length > 0;
}

function usesImmerMiddleware(sourceCode) {
  return sourceCode.ast.body.some(
    (statement) =>
      statement.type === 'ImportDeclaration' && /immer/u.test(statement.source.value)
  );
}

function hasStateCreatorSignature(node) {
  const [firstParam] = node.params;
  if (!firstParam) return false;
  if (firstParam.type === 'RestElement') return true;
  return firstParam.type === 'Identifier' && SET_PARAM_NAMES.has(firstParam.name);
}

function getTypeAnnotationName(typeAnnotation) {
  const inner = typeAnnotation?.typeAnnotation ?? typeAnnotation;
  if (inner?.type !== 'TSTypeReference') return undefined;
  return getCalleeName(inner.typeName);
}

function hasStateCreatorAnnotation(node) {
  const { parent } = node;
  if (!parent) return false;
  if (parent.type === 'VariableDeclarator' && parent.init === node) {
    return getTypeAnnotationName(parent.id.typeAnnotation) === 'StateCreator';
  }
  if (parent.type === 'TSAsExpression' || parent.type === 'TSSatisfiesExpression') {
    return getTypeAnnotationName(parent.typeAnnotation) === 'StateCreator';
  }
  return false;
}

function isCallArgument(node) {
  const { parent } = node;
  return parent?.type === 'CallExpression' && parent.arguments.includes(node);
}

function isCurriedCallee(node) {
  return node.parent?.type === 'CallExpression' && node.parent.callee === node;
}

function getReturnedObject(body) {
  const returnStatement = body.body.find((statement) => statement.type === 'ReturnStatement');
  const returned = unwrapExpression(returnStatement?.argument);
  return returned?.type === 'ObjectExpression' ? returned : undefined;
}

function getStateObject(stateCreator) {
  const body = unwrapExpression(stateCreator.body);
  if (body.type === 'ObjectExpression') return body;
  if (body.type === 'BlockStatement') return getReturnedObject(body);
  return undefined;
}

function isStateProperty(property) {
  if (property.type !== 'Property') return false;
  return !isFunctionExpression(unwrapExpression(property.value));
}

function isActionProperty(property) {
  return property.type === 'Property' && isFunctionExpression(unwrapExpression(property.value));
}

function createZustandContext(context) {
  const sourceCode = getSourceCode(context);
  const createBindings = getCreateBindings(sourceCode);

  const isCreateCall = (node) =>
    node.type === 'CallExpression' &&
    createBindings.has(getUnqualifiedCalleeName(node.callee));

  const isStoreCreation = (node) => isCreateCall(node) && !isCurriedCallee(node);

  const isWrappedByCreateCall = (node) => {
    if (!isCallArgument(node)) return false;
    if (isCreateCall(node.parent)) return true;
    return isWrappedByCreateCall(node.parent);
  };

  const isStateCreator = (node) => {
    if (!isFunctionExpression(node)) return false;
    if (!hasStateCreatorSignature(node)) return false;
    return isWrappedByCreateCall(node) || hasStateCreatorAnnotation(node);
  };

  return {
    sourceCode,
    hasZustandImport: importsZustand(sourceCode),
    usesImmer: usesImmerMiddleware(sourceCode),
    isStoreCreation,
    isStateCreator,
    getEnclosingStateCreator: (node) => findAncestor(node, isStateCreator),
  };
}

function isStoreHookName(name, pattern) {
  if (!name) return false;
  return new RegExp(pattern, 'u').test(name);
}

function isShallowWrapped(argument) {
  const expression = unwrapExpression(argument);
  if (expression?.type !== 'CallExpression') return false;
  return getCalleeName(expression.callee) === 'useShallow';
}

function getSelectorReturn(selector) {
  const body = unwrapExpression(selector.body);

  if (body.type !== 'BlockStatement') return body;

  const returnStatement = body.body.find((statement) => statement.type === 'ReturnStatement');

  return unwrapExpression(returnStatement?.argument);
}

function getEnclosingFunction(node) {
  return findAncestor(
    node,
    (ancestor) =>
      !ancestor.parent ||
      isFunctionExpression(ancestor) ||
      ancestor.type === 'FunctionDeclaration'
  );
}

module.exports = {
  DEFAULT_STORE_HOOK_PATTERN,
  createZustandContext,
  getCalleeName,
  getEnclosingFunction,
  getSelectorReturn,
  getStateObject,
  isActionProperty,
  isFunctionExpression,
  isShallowWrapped,
  isStateProperty,
  isStoreHookName,
  unwrapExpression,
};

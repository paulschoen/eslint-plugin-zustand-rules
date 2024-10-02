/**
 * Determines if a file contains a Zustand store definition.
 * 
 * @param {ASTNode} context - The AST context of the file being linted.
 * @returns {boolean} - Returns true if the file is a Zustand store, otherwise false.
 */
function isZustandStore(node) {
  if (node.type === 'ImportDeclaration' && node.source.value === 'zustand') {
    return node.specifiers.some(specifier => specifier.imported && specifier.imported.name === 'create');
  }
  return false;
}


module.exports = {
  isZustandStore
};

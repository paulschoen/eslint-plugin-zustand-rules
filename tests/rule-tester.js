const { RuleTester } = require('eslint');

function createRuleTester() {
  return new RuleTester({
    parser: require.resolve('@typescript-eslint/parser'),
    parserOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      ecmaFeatures: { jsx: true },
    },
  });
}

module.exports = { createRuleTester };

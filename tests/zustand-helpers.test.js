const { isZustandStore } = require('../lib/helpers/zustand-helpers');

describe('isZustandStore', () => {
  it('should return true for files importing create from zustand', () => {
    const node = {
      type: 'ImportDeclaration',
      source: { value: 'zustand' },
      specifiers: [
        { imported: { name: 'create' } }
      ]
    };

    expect(isZustandStore(node)).toBe(true);
  });

  it('should return false for files not importing zustand', () => {
    const node = {
      type: 'ImportDeclaration',
      source: { value: 'react' },
      specifiers: [
        { imported: { name: 'useState' } }
      ]
    };

    expect(isZustandStore(node)).toBe(false);
  });

  it('should return false if create is not imported from zustand', () => {
    const node = {
      type: 'ImportDeclaration',
      source: { value: 'zustand' },
      specifiers: [
        { imported: { name: 'somethingElse' } }
      ]
    };

    expect(isZustandStore(node)).toBe(false);
  });
});

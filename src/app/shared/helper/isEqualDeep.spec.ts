import { isEqualDeep } from './isEqualDeep';

describe('isEqualDeep', () => {
  it('should return true for identical primitive values', () => {
    expect(isEqualDeep(5, 5)).toBe(true);
    expect(isEqualDeep('hello', 'hello')).toBe(true);
  });

  it('should return true for arrays with same elements in different orders', () => {
    expect(isEqualDeep([1, 2, 3], [3, 2, 1])).toBe(true);
  });

  it('should return false for arrays with different elements', () => {
    expect(isEqualDeep([1, 2], [2, 3])).toBe(false);
  });

  it('should return true for identical objects', () => {
    expect(isEqualDeep({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true);
  });

  it('should return false for objects with different keys', () => {
    expect(isEqualDeep({ a: 1, b: 2 }, { a: 1, c: 2 })).toBe(false);
  });
});

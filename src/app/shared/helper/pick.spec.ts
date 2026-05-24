import { pick } from './pick';

describe('pick', () => {
  it('should select specified keys from an object', () => {
    const object = { a: 1, b: 2, c: 3 };
    const result = pick(object, 'a', 'c');
    expect(result).toEqual({ a: 1, c: 3 });
  });

  it('should ignore keys that do not exist in the object', () => {
    const object = { a: 1, b: 2 };
    // @ts-expect-error
    const result = pick(object, 'a', 'nonexistent');
    expect(result).toEqual({ a: 1 });
  });
});

import { mergeDeepCustom } from './deepMerge';

interface TestObj {
  a?: number;
  b?: { c?: number; d?: number };
  e?: number;
  arr?: (number | { id: number; val: string })[];
}

describe('deepMerge', () => {
  it('should return target if no sources are provided', () => {
    const target = { a: 1 };
    expect(mergeDeepCustom<{ a: number }>(target)).toBe(target);
  });

  it('should deeply merge plain objects', () => {
    const target = { a: 1, b: { c: 2 } };
    const source1 = { b: { d: 3 }, e: 4 };
    const result = mergeDeepCustom<TestObj>(target, source1);

    expect(result).toEqual({
      a: 1,
      b: { c: 2, d: 3 },
      e: 4,
    });
  });

  it('should merge arrays of primitives without objects by taking union of unique elements', () => {
    const target = { arr: [1, 2] };
    const source = { arr: [2, 3, 4] };
    const result = mergeDeepCustom<TestObj>(target, source);

    expect(result.arr).toEqual([1, 2, 3, 4]);
  });

  it('should merge arrays containing objects recursively', () => {
    const target = {
      arr: [
        { id: 1, val: 'a' },
        { id: 2, val: 'b' },
      ],
    };
    const source = {
      arr: [
        { id: 1, val: 'changed' },
        { id: 3, val: 'c' },
      ],
    };
    const result = mergeDeepCustom<TestObj>(target, source);

    expect(result.arr?.[0]).toEqual({ id: 1, val: 'changed' });
    expect(result.arr?.[1]).toEqual({ id: 3, val: 'c' });
  });
});

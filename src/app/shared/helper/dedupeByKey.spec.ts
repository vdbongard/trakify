import { dedupeByKey } from './dedupeByKey';

describe('dedupeByKey', () => {
  it('keeps the first item of each key', () => {
    const items = [
      { id: 1, name: 'first' },
      { id: 2, name: 'second' },
      { id: 1, name: 'duplicate' },
    ];

    expect(dedupeByKey(items, (item) => item.id)).toEqual([
      { id: 1, name: 'first' },
      { id: 2, name: 'second' },
    ]);
  });

  it('preserves the original order', () => {
    const items = [{ id: 3 }, { id: 1 }, { id: 3 }, { id: 2 }];

    expect(dedupeByKey(items, (item) => item.id).map((item) => item.id)).toEqual([3, 1, 2]);
  });

  it('returns an empty list for no items', () => {
    expect(dedupeByKey([], (item: number) => item)).toEqual([]);
  });
});

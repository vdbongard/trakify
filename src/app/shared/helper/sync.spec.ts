import { isSyncStale } from './sync';

describe('isSyncStale', () => {
  const now = new Date('2024-05-01T12:00:00.000Z');

  it('returns true when the last sync is older than one hour', () => {
    expect(isSyncStale('2024-05-01T10:59:59.000Z', now)).toBe(true);
    expect(isSyncStale('2024-05-01T11:00:00.000Z', now)).toBe(true);
  });

  it('returns false when the last sync is within the last hour', () => {
    expect(isSyncStale('2024-05-01T11:00:01.000Z', now)).toBe(false);
  });

  it('returns true when there has been no previous sync', () => {
    expect(isSyncStale(undefined, now)).toBe(true);
    expect(isSyncStale(null, now)).toBe(true);
  });
});

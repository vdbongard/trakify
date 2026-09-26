import { isSyncStale, shouldSyncOnLogin } from './sync';

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

describe('shouldSyncOnLogin', () => {
  const now = new Date('2024-05-01T12:00:00.000Z');
  const recent = '2024-05-01T11:30:00.000Z';

  it('skips a fresh sync when there is cached data', () => {
    expect(shouldSyncOnLogin(recent, true, now)).toBe(false);
  });

  it('syncs when the last sync is stale, even with cached data', () => {
    expect(shouldSyncOnLogin('2024-05-01T10:00:00.000Z', true, now)).toBe(true);
  });

  it('syncs when there is no cached data, even if the last sync was fresh', () => {
    // A logout empties the stores but leaves the timestamp behind; trusting it here is what
    // strands the app on an empty page.
    expect(shouldSyncOnLogin(recent, false, now)).toBe(true);
  });

  it('syncs when there is neither cached data nor a previous sync', () => {
    expect(shouldSyncOnLogin(null, false, now)).toBe(true);
  });
});

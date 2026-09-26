import { isAfter, subHours } from 'date-fns';

/** True when the previous sync is older than one hour (or never happened). */
export function isSyncStale(lastSyncedAt: string | null | undefined, now = new Date()): boolean {
  const lastSyncedAtDate = lastSyncedAt ? new Date(lastSyncedAt) : new Date(0);
  return !isAfter(lastSyncedAtDate, subHours(now, 1));
}

/**
 * Whether logging in should start a sync.
 *
 * Staleness alone is not enough. A logout (or any cleared cache) leaves the stores empty while
 * the fetch timestamp is still recent, and trusting that timestamp skips the only sync that
 * would refill them, so the app stays empty across every later load until the user syncs by
 * hand. `hasCachedData` therefore has to be consulted as well.
 *
 * It answers whether the key exists, not how much it holds: an account with nothing watched
 * caches an empty array, and treating that as "no data" would re-sync on every page load.
 */
export function shouldSyncOnLogin(
  lastSyncedAt: string | null | undefined,
  hasCachedData: boolean,
  now = new Date(),
): boolean {
  return isSyncStale(lastSyncedAt, now) || !hasCachedData;
}

import { isAfter, subHours } from 'date-fns';

export function isSyncStale(lastSyncedAt: string | null, now = new Date()): boolean {
  const lastSyncedAtDate = lastSyncedAt ? new Date(lastSyncedAt) : new Date(0);
  return !isAfter(lastSyncedAtDate, subHours(now, 1));
}

export function shouldSyncOnLogin(
  lastSyncedAt: string | null,
  hasCachedData: boolean,
  now = new Date(),
): boolean {
  return isSyncStale(lastSyncedAt, now) || !hasCachedData;
}

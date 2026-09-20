import { isAfter, subHours } from 'date-fns';

/** True when the previous sync is older than one hour (or never happened). */
export function isSyncStale(lastSyncedAt: string | null | undefined, now = new Date()): boolean {
  const lastSyncedAtDate = lastSyncedAt ? new Date(lastSyncedAt) : new Date(0);
  return !isAfter(lastSyncedAtDate, subHours(now, 1));
}

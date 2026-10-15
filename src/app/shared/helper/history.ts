import { formatDate } from '@angular/common';
import { isSameDay, isSameYear, subDays } from 'date-fns';
import type { HistoryPlay } from '@type/Trakt';

export interface HistoryDayGroup {
  label: string;
  plays: HistoryPlay[];
}

/**
 * Day heading for a Play: `Today`/`Yesterday`, then the weekday and date (with the year once the
 * Play is not from the current year). Dates are rendered in the viewer's local timezone.
 */
export function historyDayLabel(watchedAt: string, now: Date = new Date()): string {
  const date = new Date(watchedAt);

  if (isSameDay(date, now)) return 'Today';
  if (isSameDay(date, subDays(now, 1))) return 'Yesterday';

  return formatDate(date, isSameYear(date, now) ? 'EEEE d MMM' : 'EEEE d MMM yyyy', 'en-US');
}

/**
 * Groups Plays into day sections, preserving the order Trakt returned them in (newest first).
 * Only adjacent Plays can share a group: the server is the ordering authority, so re-grouping
 * out of order would silently reorder the History.
 */
export function groupHistoryByDay(plays: HistoryPlay[], now: Date = new Date()): HistoryDayGroup[] {
  return plays.reduce<HistoryDayGroup[]>((groups, play) => {
    const label = historyDayLabel(play.watched_at, now);
    const lastGroup = groups.at(-1);

    if (lastGroup?.label === label) lastGroup.plays.push(play);
    else groups.push({ label, plays: [play] });

    return groups;
  }, []);
}

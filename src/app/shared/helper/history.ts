import { formatDate } from '@angular/common';
import { isSameDay, isSameYear, subDays } from 'date-fns';
import { getShowSlug } from '@helper/getShowSlug';
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

const EPISODE_URL = /\/shows\/s\/([^/]+)\/season\/(\d+)\/episode\/(\d+)/;

/**
 * The Play an Episode URL points at, when the History is showing it. Used to name the row a
 * navigation came back from: a History entry keeps its own navigation state, so a back navigation
 * carries no Episode — the URL that was left is the only record of where the reader came from.
 */
export function playForEpisodeUrl(plays: HistoryPlay[], url: string): HistoryPlay | undefined {
  const match = EPISODE_URL.exec(url);
  if (!match) return undefined;

  const [, showSlug, season, number] = match;
  return plays.find(
    (play) =>
      getShowSlug(play.show) === showSlug &&
      play.episode.season === Number(season) &&
      play.episode.number === Number(number),
  );
}

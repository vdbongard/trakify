import { formatDate } from '@angular/common';
import { isSameDay, isSameYear, subDays } from 'date-fns';
import { dedupeByKey } from '@helper/dedupeByKey';
import { getShowSlug } from '@helper/getShowSlug';
import { toEpisodeId } from '@helper/toShowId';
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

export interface EpisodeUrlTarget {
  showSlug: string;
  season: number;
  number: number;
}

/** The Episode an Episode page URL points at, if it points at one. */
export function episodeUrlTarget(url: string): EpisodeUrlTarget | undefined {
  const match = EPISODE_URL.exec(url);
  if (!match) return undefined;

  const [, showSlug, season, number] = match;
  return { showSlug, season: Number(season), number: Number(number) };
}

/**
 * The Play an Episode URL points at, when the History is showing it. Used to name the row a
 * navigation came back from: a History entry keeps its own navigation state, so a back navigation
 * carries no Episode — the URL that was left is the only record of where the reader came from.
 */
export function playForEpisodeUrl(plays: HistoryPlay[], url: string): HistoryPlay | undefined {
  const target = episodeUrlTarget(url);
  if (!target) return undefined;

  return plays.find(
    (play) =>
      getShowSlug(play.show) === target.showSlug &&
      play.episode.season === target.season &&
      play.episode.number === target.number,
  );
}

/** A Play's Episode within its Show: how the History tells two Plays of the same Episode apart. */
export function playKey(play: HistoryPlay): string {
  return toEpisodeId(play.show.ids.trakt, play.episode.season, play.episode.number);
}

/**
 * The Plays the History needs artwork for: one per Episode, never one per Play, and only for Plays
 * whose Show has a TMDB id — without one there is no artwork to ask for, and the queries of two
 * Shows would collide.
 */
export function uniqueEpisodePlays(plays: HistoryPlay[]): HistoryPlay[] {
  return dedupeByKey(
    plays.filter((play) => play.show.ids.tmdb != null),
    (play) => playKey(play),
  );
}

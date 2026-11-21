import { formatDate } from '@angular/common';
import { isSameDay, isSameYear, subDays } from 'date-fns';
import { dedupeByKey } from '@helper/dedupeByKey';
import { episodeUrlTarget } from '@helper/episodeUrl';
import { getShowSlug } from '@helper/getShowSlug';
import { toEpisodeId } from '@helper/toShowId';
import type { HistoryPlay } from '@type/Trakt';

export interface HistoryDayGroup {
  label: string;
  plays: HistoryPlay[];
}

export function historyDayLabel(watchedAt: string, now: Date = new Date()): string {
  const date = new Date(watchedAt);

  if (isSameDay(date, now)) return 'Today';
  if (isSameDay(date, subDays(now, 1))) return 'Yesterday';

  return formatDate(date, isSameYear(date, now) ? 'EEEE d MMM' : 'EEEE d MMM yyyy', 'en-US');
}

export function groupHistoryByDay(plays: HistoryPlay[], now: Date = new Date()): HistoryDayGroup[] {
  return plays.reduce<HistoryDayGroup[]>((groups, play) => {
    const label = historyDayLabel(play.watched_at, now);
    const lastGroup = groups.at(-1);

    if (lastGroup?.label === label) lastGroup.plays.push(play);
    else groups.push({ label, plays: [play] });

    return groups;
  }, []);
}

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

export function playKey(play: HistoryPlay): string {
  return toEpisodeId(play.show.ids.trakt, play.episode.season, play.episode.number);
}

export function uniqueEpisodePlays(plays: HistoryPlay[]): HistoryPlay[] {
  return dedupeByKey(
    plays.filter((play) => play.show.ids.tmdb != null),
    (play) => playKey(play),
  );
}

import { groupHistoryByDay, historyDayLabel } from './history';
import type { HistoryPlay } from '@type/Trakt';

const NOW = new Date('2026-10-15T12:00:00');

function makePlay(id: number, watchedAt: string): HistoryPlay {
  return {
    action: 'watch',
    episode: { ids: { trakt: id, tmdb: null }, number: 1, season: 1, title: `Episode ${id}` },
    id,
    show: {
      ids: { trakt: 1, slug: 'breaking-bad', tmdb: 1399 },
      title: 'Breaking Bad',
      year: 2008,
    },
    type: 'episode',
    watched_at: watchedAt,
  };
}

describe('historyDayLabel', () => {
  it('labels a Play from today', () => {
    expect(historyDayLabel('2026-10-15T20:15:00', NOW)).toBe('Today');
  });

  it('labels a Play from yesterday', () => {
    expect(historyDayLabel('2026-10-14T23:55:00', NOW)).toBe('Yesterday');
  });

  it('labels older Plays in the same year with their weekday and date', () => {
    expect(historyDayLabel('2026-10-10T20:15:00', NOW)).toBe('Saturday 10 Oct');
  });

  it('adds the year to Plays from another year', () => {
    expect(historyDayLabel('2025-12-31T20:15:00', NOW)).toBe('Wednesday 31 Dec 2025');
  });
});

describe('groupHistoryByDay', () => {
  it('collects consecutive Plays of the same day into one group', () => {
    const plays = [
      makePlay(3, '2026-10-15T21:00:00'),
      makePlay(2, '2026-10-15T20:00:00'),
      makePlay(1, '2026-10-14T19:00:00'),
    ];

    const groups = groupHistoryByDay(plays, NOW);

    expect(groups.map((group) => group.label)).toEqual(['Today', 'Yesterday']);
    expect(groups[0].plays.map((play) => play.id)).toEqual([3, 2]);
    expect(groups[1].plays.map((play) => play.id)).toEqual([1]);
  });

  it('returns no groups for no Plays', () => {
    expect(groupHistoryByDay([], NOW)).toEqual([]);
  });
});

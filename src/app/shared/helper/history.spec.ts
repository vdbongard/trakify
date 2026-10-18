import {
  groupHistoryByDay,
  historyDayLabel,
  playForEpisodeUrl,
  uniqueEpisodePlays,
} from './history';
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

describe('playForEpisodeUrl', () => {
  const plays = [
    makePlay(3, '2026-10-15T21:00:00'),
    {
      ...makePlay(2, '2026-10-15T20:00:00'),
      episode: { ids: { trakt: 2, tmdb: null }, number: 5, season: 2, title: 'Breakage' },
    },
  ];

  it('finds the Play an Episode URL points at', () => {
    expect(playForEpisodeUrl(plays, '/shows/s/breaking-bad/season/2/episode/5')?.id).toBe(2);
  });

  it('ignores URLs that are not Episode pages', () => {
    expect(playForEpisodeUrl(plays, '/shows/watchlist')).toBeUndefined();
    expect(playForEpisodeUrl(plays, '/shows/s/breaking-bad/season/2')).toBeUndefined();
  });

  it('ignores an Episode the History is not showing', () => {
    expect(playForEpisodeUrl(plays, '/shows/s/breaking-bad/season/2/episode/6')).toBeUndefined();
    expect(playForEpisodeUrl(plays, '/shows/s/other-show/season/2/episode/5')).toBeUndefined();
  });

  it('reads the rest of the URL as part of the Episode URL', () => {
    expect(playForEpisodeUrl(plays, '/shows/s/breaking-bad/season/1/episode/1?from=tab')?.id).toBe(
      3,
    );
  });
});

describe('uniqueEpisodePlays', () => {
  it('keeps one Play per Episode, so a rewatch asks for the same still once', () => {
    const plays = [makePlay(3, '2026-10-15T21:00:00'), makePlay(2, '2026-10-15T20:00:00')];

    expect(uniqueEpisodePlays(plays).map((play) => play.id)).toEqual([3]);
  });

  it('keeps Plays of different Episodes apart', () => {
    const plays = [
      makePlay(3, '2026-10-15T21:00:00'),
      {
        ...makePlay(2, '2026-10-15T20:00:00'),
        episode: { ids: { trakt: 2, tmdb: null }, number: 5, season: 2, title: 'Breakage' },
      },
    ];

    expect(uniqueEpisodePlays(plays).map((play) => play.id)).toEqual([3, 2]);
  });

  it('leaves out Plays of Shows without a TMDB id, which have no artwork to ask for', () => {
    const play = makePlay(3, '2026-10-15T21:00:00');
    const orphan = { ...play, show: { ...play.show, ids: { ...play.show.ids, tmdb: null } } };

    expect(uniqueEpisodePlays([orphan])).toEqual([]);
  });
});

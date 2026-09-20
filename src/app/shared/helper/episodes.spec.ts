import {
  advanceNextEpisode,
  getAiredEpisodes,
  getAiredEpisodesInSeason,
  getRemainingEpisodes,
  isDetailedProgress,
  markEpisodeWatched,
  unmarkEpisodeWatched,
} from './episodes';
import {
  ShowProgress,
  ShowProgressCompact,
  EpisodeFull,
  SeasonProgress,
  Episode,
} from '@type/Trakt';
import { TmdbSeason } from '@type/Tmdb';

describe('episodes helper', () => {
  describe('isDetailedProgress', () => {
    it('should return true for seasonal detail progress', () => {
      const progress = { seasons: [] } as unknown as ShowProgress;
      expect(isDetailedProgress(progress)).toBe(true);
    });

    it('should return false for overview compact progress', () => {
      const progress = { completed: 0, aired: 0 } as ShowProgressCompact;
      expect(isDetailedProgress(progress)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isDetailedProgress(undefined)).toBe(false);
    });
  });
  describe('getAiredEpisodes', () => {
    it('should calculate aired episodes by progress for all seasons', () => {
      const showProgress = {
        seasons: [
          { number: 0, aired: 3, episodes: [{}, {}, {}] }, // Specials - ignored
          { number: 1, aired: 10, episodes: new Array(10).fill({}) },
          { number: 2, aired: 8, episodes: new Array(8).fill({}) },
        ],
      } as unknown as ShowProgress;

      expect(getAiredEpisodes(showProgress)).toBe(18);
    });

    it('should calculate aired episodes by progress for a specific season', () => {
      const showProgress = {
        seasons: [
          { number: 1, aired: 10, episodes: new Array(10).fill({}) },
          { number: 2, aired: 8, episodes: new Array(8).fill({}) },
        ],
      } as unknown as ShowProgress;

      expect(getAiredEpisodes(showProgress, undefined, null, 2)).toBe(8);
    });

    it('should use aired episodes by date if greater than progress', () => {
      const showProgress = {
        seasons: [{ number: 1, aired: 2, episodes: [{}, {}] }],
      } as unknown as ShowProgress;
      const episode = { season: 1 } as EpisodeFull;
      const tmdbSeason = {
        episodes: [
          { air_date: '2000-01-01' }, // past
          { air_date: '2000-01-02' }, // past
          { air_date: '3000-01-01' }, // future
        ],
      } as unknown as TmdbSeason;

      expect(getAiredEpisodes(showProgress, episode, tmdbSeason)).toBe(2);
    });
  });

  describe('getAiredEpisodesInSeason', () => {
    it('should return max of progress and date-calculated aired count', () => {
      const seasonEpisodes = [
        { first_aired: '2000-01-01' },
        { first_aired: '3000-01-01' },
      ] as unknown as EpisodeFull[];
      const seasonProgress = { aired: 5 } as SeasonProgress;

      expect(getAiredEpisodesInSeason(seasonEpisodes, seasonProgress)).toBe(5);
      expect(getAiredEpisodesInSeason(seasonEpisodes, { aired: 0 } as SeasonProgress)).toBe(1);
    });
  });

  describe('getRemainingEpisodes', () => {
    it('should return remaining episodes (aired - completed)', () => {
      const showProgress = {
        completed: 5,
        seasons: [{ number: 1, aired: 12, episodes: new Array(12).fill({}) }],
      } as unknown as ShowProgress;

      expect(getRemainingEpisodes(showProgress, undefined, null)).toBe(7);
    });

    it('should return -1 if completed is 0 or less', () => {
      const showProgress = {
        completed: 0,
        seasons: [{ number: 1, aired: 12, episodes: new Array(12).fill({}) }],
      } as unknown as ShowProgress;

      expect(getRemainingEpisodes(showProgress, undefined, null)).toBe(-1);
    });
  });

  describe('advanceNextEpisode', () => {
    it('should advance to the next number within the same season with a synthetic episode', () => {
      const nextEpisode = { ids: { trakt: 2 }, season: 1, number: 2, title: 'Ep 2' } as Episode;

      expect(advanceNextEpisode(nextEpisode)).toEqual({
        ids: { trakt: 0 },
        season: 1,
        number: 3,
        title: null,
      });
    });
  });

  describe('markEpisodeWatched', () => {
    const buildOverview = (over: Partial<ShowProgressCompact> = {}): ShowProgressCompact =>
      ({
        aired: 10,
        completed: 5,
        last_episode: null,
        last_watched_at: null,
        next_episode: { ids: { trakt: 2 }, season: 1, number: 2, title: 'Ep 2' },
        reset_at: null,
        ...over,
      }) as ShowProgressCompact;

    const episode1 = { ids: { trakt: 1 }, season: 1, number: 1 } as Episode;
    const episode2 = { ids: { trakt: 2 }, season: 1, number: 2 } as Episode;

    it('should increment completed and clamp aired to completed', () => {
      const overview = buildOverview({ completed: 10, aired: 10 });

      markEpisodeWatched(overview, episode2);

      expect(overview.completed).toBe(11);
      expect(overview.aired).toBe(11);
    });

    it('should keep aired untouched when completed stays below aired', () => {
      const overview = buildOverview();

      markEpisodeWatched(overview, episode1);

      expect(overview.completed).toBe(6);
      expect(overview.aired).toBe(10);
    });

    it('should advance the next episode when the watched episode is the current next episode', () => {
      const overview = buildOverview();

      markEpisodeWatched(overview, episode2);

      expect(overview.next_episode?.season).toBe(1);
      expect(overview.next_episode?.number).toBe(3);
      expect(overview.next_episode?.title).toBeNull();
    });

    it('should keep the next episode when watching an earlier episode', () => {
      const overview = buildOverview();

      markEpisodeWatched(overview, episode1);

      expect(overview.next_episode?.season).toBe(1);
      expect(overview.next_episode?.number).toBe(2);
    });

    it('should keep next episode null when there is none', () => {
      const overview = buildOverview({ next_episode: null });

      markEpisodeWatched(overview, episode2);

      expect(overview.next_episode).toBeNull();
    });

    it('should produce values matching a subsequent sync (no drift)', () => {
      const overview = buildOverview();
      markEpisodeWatched(overview, episode2);

      const synced = { aired: 10, completed: 6, next_episode: { season: 1, number: 3 } };

      expect(overview.aired).toBe(synced.aired);
      expect(overview.completed).toBe(synced.completed);
      expect(overview.next_episode?.season).toBe(synced.next_episode.season);
      expect(overview.next_episode?.number).toBe(synced.next_episode.number);
    });
  });

  describe('unmarkEpisodeWatched', () => {
    const buildOverview = (completed: number): ShowProgressCompact =>
      ({
        aired: 10,
        completed,
        last_episode: null,
        last_watched_at: null,
        next_episode: { ids: { trakt: 2 }, season: 1, number: 2, title: 'Ep 2' },
        reset_at: null,
      }) as ShowProgressCompact;

    it('should decrement completed without going below zero', () => {
      const overview = buildOverview(0);

      unmarkEpisodeWatched(overview);

      expect(overview.completed).toBe(0);
    });

    it('should leave the next episode untouched when removing', () => {
      const overview = buildOverview(5);

      unmarkEpisodeWatched(overview);

      expect(overview.completed).toBe(4);
      expect(overview.next_episode?.number).toBe(2);
    });
  });
});

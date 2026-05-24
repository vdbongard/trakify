import { getAiredEpisodes, getAiredEpisodesInSeason, getRemainingEpisodes } from './episodes';
import { ShowProgress, EpisodeFull, SeasonProgress } from '@type/Trakt';
import { TmdbSeason } from '@type/Tmdb';

describe('episodes helper', () => {
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
});

import { isShowFiltered, sortShows, isNextEpisodeOrLater } from './shows';
import { Filter, Sort, SortOptions } from '@type/Enum';
import { Config } from '@type/Config';
import { Episode, EpisodeFull, Show, ShowHidden, ShowProgress } from '@type/Trakt';
import { ShowInfo } from '@type/Show';
import { toEpisodeId } from './toShowId';

function createShow(id: number, title = `Show ${id}`): Show {
  return {
    title,
    year: 2020,
    ids: {
      trakt: id,
      slug: `show-${id}`,
      tmdb: id,
      tvdb: id,
      tvrage: id,
      imdb: `tt${id}`,
    },
  };
}

function createShowInfo(id: number, title?: string): ShowInfo {
  return {
    show: createShow(id, title),
  } as ShowInfo;
}

function createEpisodeFull(
  showId: number,
  season: number,
  number: number,
  firstAired?: string,
): EpisodeFull {
  return {
    ids: {
      trakt: Number(`${showId}${season}${number}`),
      tmdb: Number(`${showId}${season}${number}`),
      tvdb: Number(`${showId}${season}${number}`),
      tvrage: Number(`${showId}${season}${number}`),
      imdb: `tt${showId}${season}${number}`,
    },
    number,
    season,
    title: `S${season}E${number}`,
    first_aired: firstAired ?? null,
  };
}

describe('shows helper', () => {
  describe('isShowFiltered', () => {
    it('should return false if no filters are active', () => {
      const config = { filters: [] } as unknown as Config;
      const show = { ids: { trakt: 123 } } as Show;
      expect(isShowFiltered(config, show, undefined, [])).toBe(false);
    });

    it('should filter out hidden shows', () => {
      const config = {
        filters: [{ name: Filter.HIDDEN, value: true, category: 'hide' }],
      } as unknown as Config;
      const show = { ids: { trakt: 123 } } as Show;
      const showsHidden = [{ show: { ids: { trakt: 123 } } }] as ShowHidden[];

      expect(isShowFiltered(config, show, undefined, showsHidden)).toBe(true);
    });

    it('should filter when no new episodes filter with hide category matches', () => {
      const config = {
        filters: [{ name: Filter.NO_NEW_EPISODES, value: true, category: 'hide' }],
      } as unknown as Config;
      const show = { ids: { trakt: 123 } } as Show;
      const showProgress = {
        aired: 2,
        completed: 2,
        last_episode: null,
        last_watched_at: null,
        reset_at: null,
        seasons: [{ number: 1, aired: 2, completed: 2, title: null, episodes: [] }],
      } as ShowProgress;

      expect(isShowFiltered(config, show, showProgress, [])).toBe(true);
    });

    it('should filter when hidden filter with show category does not match', () => {
      const config = {
        filters: [{ name: Filter.HIDDEN, value: true, category: 'show' }],
      } as unknown as Config;
      const show = { ids: { trakt: 123 } } as Show;

      expect(isShowFiltered(config, show, undefined, [])).toBe(true);
    });
  });

  describe('sortShows', () => {
    it('should sort shows favorites first', () => {
      const config = {
        sort: { by: Sort.LAST_WATCHED },
        sortOptions: [{ name: SortOptions.FAVORITES_FIRST, value: true }],
      } as unknown as Config;

      const shows = [
        { isFavorite: false, show: { title: 'A' } },
        { isFavorite: true, show: { title: 'B' } },
      ] as unknown as ShowInfo[];

      sortShows(config, shows, {});
      expect(shows[0].show?.title).toBe('B');
    });

    it('should sort by newest episode first', () => {
      const config = {
        sort: { by: Sort.NEWEST_EPISODE },
        sortOptions: [],
      } as unknown as Config;

      const showA = createShowInfo(1, 'A');
      const showB = createShowInfo(2, 'B');
      showA.nextEpisode = { season: 1, number: 1 } as EpisodeFull;
      showB.nextEpisode = { season: 1, number: 1 } as EpisodeFull;

      const shows = [showA, showB];
      const showsEpisodes: Record<string, EpisodeFull | undefined> = {
        [toEpisodeId(1, 1, 1)]: createEpisodeFull(1, 1, 1, '2020-01-01T00:00:00.000Z'),
        [toEpisodeId(2, 1, 1)]: createEpisodeFull(2, 1, 1, '2021-01-01T00:00:00.000Z'),
      };

      sortShows(config, shows, showsEpisodes);

      expect(shows[0]?.show.title).toBe('B');
    });

    it('should sort by oldest episode first', () => {
      const config = {
        sort: { by: Sort.OLDEST_EPISODE },
        sortOptions: [],
      } as unknown as Config;

      const showA = createShowInfo(1, 'A');
      const showB = createShowInfo(2, 'B');
      showA.nextEpisode = { season: 1, number: 1 } as EpisodeFull;
      showB.nextEpisode = { season: 1, number: 1 } as EpisodeFull;

      const shows = [showA, showB];
      const showsEpisodes: Record<string, EpisodeFull | undefined> = {
        [toEpisodeId(1, 1, 1)]: createEpisodeFull(1, 1, 1, '2020-01-01T00:00:00.000Z'),
        [toEpisodeId(2, 1, 1)]: createEpisodeFull(2, 1, 1, '2021-01-01T00:00:00.000Z'),
      };

      sortShows(config, shows, showsEpisodes);

      expect(shows[0]?.show.title).toBe('A');
    });

    it('should sort by episode progress ratio ascending', () => {
      const config = {
        sort: { by: Sort.EPISODE_PROGRESS },
        sortOptions: [],
      } as unknown as Config;

      const shows = [
        {
          ...createShowInfo(1, 'A'),
          showProgress: {
            aired: 10,
            completed: 8,
            last_episode: null,
            last_watched_at: null,
            reset_at: null,
            seasons: [],
          },
        },
        {
          ...createShowInfo(2, 'B'),
          showProgress: {
            aired: 10,
            completed: 2,
            last_episode: null,
            last_watched_at: null,
            reset_at: null,
            seasons: [],
          },
        },
      ] as ShowInfo[];

      sortShows(config, shows, {});

      expect(shows[0]?.show.title).toBe('B');
    });

    it('should sort by first aired descending', () => {
      const config = {
        sort: { by: Sort.FIRST_AIRED },
        sortOptions: [],
      } as unknown as Config;

      const shows = [
        {
          ...createShowInfo(1, 'A'),
          tmdbShow: { first_air_date: '2019-01-01' },
        },
        {
          ...createShowInfo(2, 'B'),
          tmdbShow: { first_air_date: '2021-01-01' },
        },
      ] as ShowInfo[];

      sortShows(config, shows, {});

      expect(shows[0]?.show.title).toBe('B');
    });

    it('should keep order when sorting by last watched', () => {
      const config = {
        sort: { by: Sort.LAST_WATCHED },
        sortOptions: [],
      } as unknown as Config;

      const shows = [createShowInfo(1, 'A'), createShowInfo(2, 'B')];

      sortShows(config, shows, {});

      expect(shows.map((show) => show.show.title)).toEqual(['A', 'B']);
    });
  });

  describe('isNextEpisodeOrLater', () => {
    it('should return false if there is no next episode progress', () => {
      const showProgress = {} as ShowProgress;
      const episode = { season: 1, number: 1 } as Episode;
      expect(isNextEpisodeOrLater(showProgress, episode)).toBe(false);
    });

    it('should return true if it is directly the next episode', () => {
      const showProgress = { next_episode: { ids: { trakt: 123 } } } as unknown as ShowProgress;
      const episode = { ids: { trakt: 123 }, season: 1, number: 2 } as Episode;
      expect(isNextEpisodeOrLater(showProgress, episode)).toBe(true);
    });

    it('should return true when episode is later in same season', () => {
      const showProgress = {
        next_episode: { ids: { trakt: 1 }, season: 1, number: 2 },
      } as unknown as ShowProgress;
      const episode = { ids: { trakt: 2 }, season: 1, number: 3 } as Episode;

      expect(isNextEpisodeOrLater(showProgress, episode)).toBe(true);
    });

    it('should return true when episode is in later season', () => {
      const showProgress = {
        next_episode: { ids: { trakt: 1 }, season: 1, number: 10 },
      } as unknown as ShowProgress;
      const episode = { ids: { trakt: 2 }, season: 2, number: 1 } as Episode;

      expect(isNextEpisodeOrLater(showProgress, episode)).toBe(true);
    });

    it('should return false when episode is earlier than next episode', () => {
      const showProgress = {
        next_episode: { ids: { trakt: 1 }, season: 2, number: 5 },
      } as unknown as ShowProgress;
      const episode = { ids: { trakt: 2 }, season: 2, number: 4 } as Episode;

      expect(isNextEpisodeOrLater(showProgress, episode)).toBe(false);
    });
  });
});

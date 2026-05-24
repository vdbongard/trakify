import { isShowFiltered, sortShows, isNextEpisodeOrLater } from './shows';
import { Filter, Sort, SortOptions } from '@type/Enum';
import { Config } from '@type/Config';
import { Show, ShowProgress, ShowHidden, Episode } from '@type/Trakt';
import { ShowInfo } from '@type/Show';

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
  });
});

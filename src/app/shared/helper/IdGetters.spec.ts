import { getShowId, getShowWithEpisodeId } from './IdGetters';
import { Show, EpisodeFull } from '@type/Trakt';

describe('IdGetters', () => {
  describe('getShowId', () => {
    it('should return show-slug when show has slug', () => {
      const show = { ids: { slug: 'breaking-bad' } } as unknown as Show;
      expect(getShowId(show)).toBe('show-breaking-bad');
    });

    it('should return show- when show is null, undefined, or has no slug', () => {
      expect(getShowId(null)).toBe('show-');
      expect(getShowId(undefined)).toBe('show-');
      expect(getShowId({ ids: {} } as unknown as Show)).toBe('show-');
    });
  });

  describe('getShowWithEpisodeId', () => {
    it('should return show-slug-episode-trakt when both exist', () => {
      const show = { ids: { slug: 'breaking-bad' } } as unknown as Show;
      const episode = { ids: { trakt: 12345 } } as unknown as EpisodeFull;
      expect(getShowWithEpisodeId(show, episode)).toBe('show-breaking-bad12345');
    });

    it('should handle null/undefined show or episode gracefully', () => {
      const show = { ids: { slug: 'breaking-bad' } } as unknown as Show;
      const episode = { ids: { trakt: 12345 } } as unknown as EpisodeFull;

      expect(getShowWithEpisodeId(null, episode)).toBe('show-12345');
      expect(getShowWithEpisodeId(show, null)).toBe('show-breaking-bad');
      expect(getShowWithEpisodeId(undefined, undefined)).toBe('show-');
    });
  });
});

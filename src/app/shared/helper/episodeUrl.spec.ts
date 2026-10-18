import { episodeUrlTarget, isEpisodeUrl } from './episodeUrl';
import { mockShow } from '@shared/mocks/mockShow';

describe('episodeUrlTarget', () => {
  it('reads the Show and Episode out of an Episode page URL', () => {
    expect(episodeUrlTarget('/shows/s/breaking-bad/season/2/episode/5')).toEqual({
      showSlug: 'breaking-bad',
      season: 2,
      number: 5,
    });
  });

  it('has nothing for URLs that are not Episode pages', () => {
    expect(episodeUrlTarget('/shows/watchlist')).toBeUndefined();
    expect(episodeUrlTarget('/shows/s/breaking-bad/season/2')).toBeUndefined();
    expect(episodeUrlTarget('/shows/s/breaking-bad')).toBeUndefined();
  });
});

describe('isEpisodeUrl', () => {
  const episode = { season: 2, number: 5 };
  // mockShow's slug is test-show
  const url = `/shows/s/${mockShow.ids.slug}/season/2/episode/5`;

  it('holds for the Episode page of this Episode of this Show', () => {
    expect(isEpisodeUrl(url, mockShow, episode)).toBe(true);
  });

  it('reads around the rest of the URL', () => {
    expect(isEpisodeUrl(`${url}?from=tab`, mockShow, episode)).toBe(true);
  });

  it('does not hold for another Episode', () => {
    expect(isEpisodeUrl(`${url}6`, mockShow, episode)).toBe(false);
    expect(
      isEpisodeUrl(`/shows/s/${mockShow.ids.slug}/season/2/episode/6`, mockShow, episode),
    ).toBe(false);
  });

  it('does not hold for another Show', () => {
    expect(isEpisodeUrl('/shows/s/breaking-bad/season/2/episode/5', mockShow, episode)).toBe(false);
  });

  it('does not hold for a URL that is not an Episode page', () => {
    expect(isEpisodeUrl('/shows/s/test-show/season/2', mockShow, episode)).toBe(false);
  });

  it('does not hold while the Show or the Episode is unknown', () => {
    expect(isEpisodeUrl(url, undefined, episode)).toBe(false);
    expect(isEpisodeUrl(url, mockShow, undefined)).toBe(false);
  });
});

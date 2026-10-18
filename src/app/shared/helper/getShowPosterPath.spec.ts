import { getShowPosterPath } from './getShowPosterPath';
import type { TmdbSeason, TmdbShow } from '@type/Tmdb';

const tmdbShow = {
  poster_path: '/show.jpg',
  seasons: [
    { season_number: 1, poster_path: '/season-1.jpg' },
    { season_number: 2, poster_path: null },
  ],
} as unknown as TmdbShow;

describe('getShowPosterPath', () => {
  it('returns the season poster from the show response for the given season', () => {
    expect(getShowPosterPath(tmdbShow, 1)).toBe('/season-1.jpg');
  });

  it('falls back to the show poster when the season has no poster', () => {
    expect(getShowPosterPath(tmdbShow, 2)).toBe('/show.jpg');
  });

  it('falls back to the show poster when the show does not list the season', () => {
    expect(getShowPosterPath(tmdbShow, 3)).toBe('/show.jpg');
  });

  it('falls back to the season detail poster when the show has no season list', () => {
    const tmdbShowWithoutSeasons = { poster_path: '/show.jpg' } as unknown as TmdbShow;
    const tmdbSeason = { poster_path: '/season.jpg' } as unknown as TmdbSeason;

    expect(getShowPosterPath(tmdbShowWithoutSeasons, 1, tmdbSeason)).toBe('/season.jpg');
  });

  it('prefers the season poster in the show response over the season detail', () => {
    const tmdbSeason = { poster_path: '/stale-season.jpg' } as unknown as TmdbSeason;

    expect(getShowPosterPath(tmdbShow, 1, tmdbSeason)).toBe('/season-1.jpg');
  });

  it('returns the season detail poster when no season number is known', () => {
    const tmdbSeason = { poster_path: '/season.jpg' } as unknown as TmdbSeason;

    expect(getShowPosterPath(tmdbShow, undefined, tmdbSeason)).toBe('/season.jpg');
  });

  it('returns the show poster when there is no season to resolve', () => {
    expect(getShowPosterPath(tmdbShow)).toBe('/show.jpg');
    expect(getShowPosterPath(tmdbShow, null)).toBe('/show.jpg');
  });

  it('returns undefined when nothing has a poster', () => {
    expect(getShowPosterPath(undefined)).toBeUndefined();
    expect(getShowPosterPath({ poster_path: null } as unknown as TmdbShow, 1)).toBeUndefined();
  });
});

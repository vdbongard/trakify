import { getTrailer } from './getTrailer';
import { TmdbShow } from '@type/Tmdb';

describe('getTrailer', () => {
  it('should return undefined if tmdbShow or videos is missing', () => {
    expect(getTrailer(undefined)).toBeUndefined();
    expect(getTrailer({} as TmdbShow)).toBeUndefined();
  });

  it('should prioritize YouTube Trailer over Teaser', () => {
    const tmdbShow = {
      videos: {
        results: [
          { site: 'YouTube', type: 'Teaser', name: 'Teaser Video' },
          { site: 'YouTube', type: 'Trailer', name: 'Trailer Video' },
        ],
      },
    } as unknown as TmdbShow;

    const result = getTrailer(tmdbShow);
    expect(result?.type).toBe('Trailer');
    expect(result?.name).toBe('Trailer Video');
  });

  it('should fallback to YouTube Teaser if Trailer is not present', () => {
    const tmdbShow = {
      videos: {
        results: [
          { site: 'YouTube', type: 'Teaser', name: 'Teaser Video' },
          { site: 'Vimeo', type: 'Trailer', name: 'Other Trailer' },
        ],
      },
    } as unknown as TmdbShow;

    const result = getTrailer(tmdbShow);
    expect(result?.type).toBe('Teaser');
    expect(result?.name).toBe('Teaser Video');
  });
});

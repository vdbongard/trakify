import { episodeTitle } from './episodeTitle';
import { Episode } from '@type/Trakt';
import { TmdbEpisode } from '@type/Tmdb';

describe('episodeTitle', () => {
  it('should return episode title if present', () => {
    const episode = { title: 'Fly' } as Episode;
    expect(episodeTitle(episode)).toBe('Fly');
  });

  it('should return tmdbEpisode name if episode title is not present but tmdb name is', () => {
    const tmdbEpisode = { name: 'Ozymandias' } as TmdbEpisode;
    expect(episodeTitle(null, undefined, tmdbEpisode)).toBe('Ozymandias');
  });

  it('should return Episode {number} if neither name is present but episodeNumber is', () => {
    expect(episodeTitle(null, 10, null)).toBe('Episode 10');
  });

  it('should return empty string if no title/name/number is available', () => {
    expect(episodeTitle()).toBe('');
  });
});

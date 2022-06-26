import { InternalConfig } from '../types/interfaces/Config';

export const traktClientId = '85ac87a505a1a8f62d1e4284ea630f0632459afcd0a9e5c9244ad4674e90140e';
export const tmdbToken =
  'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiI5NDliMTY2ZTNhMTljNjAwMjc1YWQ5ZDQ3MDllOGUxYyIsInN1YiI6IjYyOWI1ZDlkZGMxY2I0MGU0OGU0MDI2YyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ny8-L6BgKtnUOtnMM1guOrwS7WGP9VmquWYIHGwfOEY';

export const Config: InternalConfig = {
  traktBaseUrl: 'https://api.trakt.tv',
  traktOptions: {
    headers: {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'trakt-api-version': '2',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      'trakt-api-key': traktClientId,
    },
  },
  tmdbBaseUrl: 'https://api.themoviedb.org/3',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  tmdbOptions: { headers: { Authorization: `Bearer ${tmdbToken}` } },
};

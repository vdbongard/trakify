import { Ids, Show } from '@type/Trakt';

export const mockIds: Ids = {
  trakt: 123456,
  slug: 'test-show',
  tmdb: 123456,
  imdb: 'tt1234567',
  tvdb: 123456,
  tvrage: 123456,
};

export const mockShow: Show = {
  title: 'Test Show',
  year: 2023,
  ids: mockIds,
};

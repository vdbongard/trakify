import { List } from '@type/TraktList';
import { mockIds } from '@shared/mocks/mockShow';
import { mockUser } from '@shared/mocks/mockUser';
/* eslint-disable @typescript-eslint/naming-convention */

export const mockList: List = {
  allow_comments: true,
  comment_count: 42,
  created_at: '2023-10-01T12:00:00Z',
  description: 'This is a mock list description.',
  display_numbers: true,
  ids: mockIds,
  item_count: 100,
  likes: 10,
  name: 'Mock List',
  privacy: 'public',
  sort_by: 'rank',
  sort_how: 'asc',
  type: 'personal',
  updated_at: '2023-10-02T12:00:00Z',
  user: mockUser,
};

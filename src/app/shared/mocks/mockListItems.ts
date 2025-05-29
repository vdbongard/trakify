import { ListItem } from '@type/TraktList';
import { mockShow } from '@shared/mocks/mockShow';

export const mockListItems: ListItem[] = [
  {
    id: 1,
    listed_at: '2023-01-01T00:00:00Z',
    notes: null,
    rank: 1,
    show: mockShow,
    type: 'show',
  },
];

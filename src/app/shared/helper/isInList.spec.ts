import { isInList } from './isInList';
import { ListItem } from '@type/TraktList';

describe('isInList', () => {
  it('should return true if show id is present in the list items', () => {
    const listItems = [
      { show: { ids: { trakt: 123 } } },
      { show: { ids: { trakt: 456 } } },
    ] as unknown as ListItem[];

    expect(isInList(listItems, 123)).toBe(true);
    expect(isInList(listItems, 789)).toBe(false);
  });
});

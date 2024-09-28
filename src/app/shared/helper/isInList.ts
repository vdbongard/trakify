import { ListItem } from '@type/TraktList';

export function isInList(listItems: ListItem[], showId: number): boolean {
  return listItems.map((listItem) => listItem.show.ids.trakt).includes(showId);
}

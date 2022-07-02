import { List, ListItem, TraktShow } from './Trakt';

export interface ListsDialogData {
  lists: List[];
  listIds: number[];
  showId: number;
}

export interface ListItemsDialogData {
  listItems: ListItem[];
  list: List;
  shows: TraktShow[];
}

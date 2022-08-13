import { TraktShow } from './Trakt';
import { List, ListItem } from './TraktList';

export interface ListsDialogData {
  lists: List[];
  listIds: number[];
  showId: number;
}

export interface ListItemsDialogData {
  listItems?: ListItem[];
  list: List;
  shows: TraktShow[];
}

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmButton: string;
}

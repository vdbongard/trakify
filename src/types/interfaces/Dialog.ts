import { Show } from './Trakt';
import { List, ListItem } from './TraktList';

export interface ListsDialogData {
  lists: List[];
  listIds: number[];
  showId: number;
}

export interface ListItemsDialogData {
  listItems?: ListItem[];
  list: List;
  shows: Show[];
}

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmButton: string;
}

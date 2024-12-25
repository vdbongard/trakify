import { Show } from './Trakt';
import { List, ListItem } from './TraktList';
import { Video } from '@type/Tmdb';

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

export interface VideoDialogData {
  video: Video;
}

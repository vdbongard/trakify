import type { Video } from '@type/Tmdb';
import type { Show } from './Trakt';
import type { List, ListItem } from './TraktList';

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

export interface ImageDialogData {
  imageUrl: string;
  name: string;
}

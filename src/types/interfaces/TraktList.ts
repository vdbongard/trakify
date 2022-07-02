/* eslint-disable @typescript-eslint/naming-convention */
import { Ids, TraktShow, User } from './Trakt';

export interface List {
  allow_comments: boolean;
  comment_count: number;
  created_at: string;
  description: string | null;
  display_numbers: boolean;
  ids: ListIds;
  item_count: number;
  likes: number;
  name: string;
  privacy: 'private';
  sort_by: 'rank';
  sort_how: 'asc';
  type: 'personal';
  updated_at: string;
  user: User;
}

export type ListIds = Pick<Ids, 'slug' | 'trakt'>;

export interface ListItem {
  id: number;
  listed_at: string;
  notes: null;
  rank: number;
  show: TraktShow;
  type: 'show';
}

export type WatchlistItem = Omit<ListItem, 'rank'>;

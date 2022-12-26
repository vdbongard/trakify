/* eslint-disable @typescript-eslint/naming-convention */
import { Ids } from './Trakt';

export interface AddToHistoryResponse {
  added: Count1;
  not_found: CountWithIds;
}

export interface RemoveFromHistoryResponse {
  deleted: Count1;
  not_found: CountWithIds2;
}

export interface AddToListResponse {
  added: Count3;
  existing: Count3;
  not_found: CountWithIds3;
  list: ListUpdate;
}

export interface RemoveFromListResponse {
  deleted: Count3;
  not_found: CountWithIds3;
  list: ListUpdate;
}

export interface AddToWatchlistResponse {
  added: Count2;
  existing: Count2;
  not_found: CountWithIds;
  list: ListUpdate;
}

export interface RemoveFromWatchlistResponse {
  deleted: Count2;
  not_found: CountWithIds;
  list: ListUpdate;
}

export interface AddToUsersResponse {
  added: Count4;
  not_found: CountWithIds4;
}

export interface RemoveFromUsersResponse {
  deleted: Count4;
  not_found: CountWithIds4;
}

export interface Count1 {
  movies: number;
  episodes: number;
}

export interface Count2 extends Count1 {
  shows: number;
  seasons: number;
}

export interface Count3 extends Count2 {
  people: number;
}

export interface Count4 extends Count2 {
  movies: number;
  shows: number;
  seasons: number;
  users: number;
}

export interface CountWithIds {
  movies: { ids: Partial<Ids> }[];
  shows: { ids: Partial<Ids> }[];
  seasons: { ids: Partial<Ids> }[];
  episodes: { ids: Partial<Ids> }[];
}

export interface CountWithIds2 extends CountWithIds {
  ids: number[];
}

export interface CountWithIds3 extends CountWithIds {
  people: { ids: Partial<Ids> }[];
}

export interface CountWithIds4 {
  movies: { ids: Partial<Ids> }[];
  shows: { ids: Partial<Ids> }[];
  seasons: { ids: Partial<Ids> }[];
  users: { ids: Partial<Ids> }[];
}

export interface ListUpdate {
  updated_at: string;
  item_count: number;
}

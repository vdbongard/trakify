import { TmdbShow } from './Tmdb';
import { Show } from './Trakt';
import { CreateQueryResult } from '@tanstack/angular-query-experimental/src/types';

export interface Chip {
  name: string;
  slug: string;
  query: CreateQueryResult<ShowWithMeta[]>;
}

export interface ShowWithMeta {
  show: Show;
  meta: ShowMeta[];
  tmdbShow?: TmdbShow;
}

export interface ShowMeta {
  name: string;
}

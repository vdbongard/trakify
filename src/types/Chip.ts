import type { CreateQueryResult } from '@tanstack/angular-query-experimental/src/types';
import type { TmdbShow } from './Tmdb';
import type { Show } from './Trakt';

export interface Chip {
  name: string;
  slug: string;
  query: CreateQueryResult<ShowWithMeta[]>;
}

export interface ShowWithMeta {
  show: Show;
  meta: ShowMeta[];
  tmdbShow?: TmdbShow | null;
}

export interface ShowMeta {
  name: string;
}

import { TmdbShow } from './Tmdb';
import { Show } from './Trakt';
import type { CreateQueryResult } from '@tanstack/angular-query-experimental';

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

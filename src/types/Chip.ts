import { Observable } from 'rxjs';
import { Show } from './Trakt';

export interface Chip {
  name: string;
  slug: string;
  fetch: Observable<ShowWithMeta[]>;
}

export interface ShowWithMeta {
  show: Show;
  meta: ShowMeta[];
}

export interface ShowMeta {
  name: string;
}

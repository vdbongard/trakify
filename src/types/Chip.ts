import { Observable } from 'rxjs';
import { Show } from './Trakt';

export interface Chip {
  name: string;
  slug: string;
  fetch: Observable<Show[]>;
}

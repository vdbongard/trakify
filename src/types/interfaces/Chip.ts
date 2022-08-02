import { Observable } from 'rxjs';
import { TraktShow } from './Trakt';

export interface Chip {
  name: string;
  slug: string;
  fetch: Observable<TraktShow[]>;
}

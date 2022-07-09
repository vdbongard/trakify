import { Observable } from 'rxjs';
import { TraktShow } from './Trakt';

export interface Chip {
  name: string;
  observable: Observable<TraktShow[]>;
}

import { distinctUntilChanged, type MonoTypeOperatorFunction } from 'rxjs';
import { isEqualDeep } from '@helper/isEqualDeep';

export function distinctUntilChangedDeep<T>(): MonoTypeOperatorFunction<T> {
  return distinctUntilChanged((a, b) => isEqualDeep(a, b));
}

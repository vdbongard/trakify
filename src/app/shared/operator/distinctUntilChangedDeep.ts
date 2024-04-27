import { isEqualDeep } from '@helper/isEqualDeep';
import { type MonoTypeOperatorFunction, distinctUntilChanged } from 'rxjs';

export function distinctUntilChangedDeep<T>(): MonoTypeOperatorFunction<T> {
  return distinctUntilChanged((a, b) => isEqualDeep(a, b));
}

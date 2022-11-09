import { distinctUntilChanged, MonoTypeOperatorFunction } from 'rxjs';
import { isEqualDeep } from '@helper/isEqualDeep';

export function distinctUntilChangedDeep<T>(): MonoTypeOperatorFunction<T> {
  return distinctUntilChanged((a, b) => {
    return isEqualDeep(a, b);
  });
}

import { distinctUntilChanged, MonoTypeOperatorFunction } from 'rxjs';

export function distinctUntilDeepChanged<T>(): MonoTypeOperatorFunction<T> {
  return distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b));
}

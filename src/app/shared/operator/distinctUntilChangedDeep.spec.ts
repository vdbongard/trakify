import { Subject } from 'rxjs';
import { distinctUntilChangedDeep } from './distinctUntilChangedDeep';

describe('distinctUntilChangedDeep', () => {
  it('should pass through distinct values', () => {
    const source$ = new Subject<{ id: number }>();
    const values: { id: number }[] = [];

    source$.pipe(distinctUntilChangedDeep()).subscribe((v) => values.push(v));

    source$.next({ id: 1 });
    source$.next({ id: 2 });
    expect(values).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('should skip duplicate deep-equal values', () => {
    const source$ = new Subject<{ a: { b: number } }>();
    const values: { a: { b: number } }[] = [];

    source$.pipe(distinctUntilChangedDeep()).subscribe((v) => values.push(v));

    source$.next({ a: { b: 1 } });
    source$.next({ a: { b: 1 } });
    expect(values).toEqual([{ a: { b: 1 } }]);
  });

  it('should pass through different nested values', () => {
    const source$ = new Subject<{ a: { b: number } }>();
    const values: { a: { b: number } }[] = [];

    source$.pipe(distinctUntilChangedDeep()).subscribe((v) => values.push(v));

    source$.next({ a: { b: 1 } });
    source$.next({ a: { b: 2 } });
    expect(values).toEqual([{ a: { b: 1 } }, { a: { b: 2 } }]);
  });
});

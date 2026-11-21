import { map, Observable, of, switchMap } from 'rxjs';

export function requestPagesUntilEmpty<T>(
  fetchPage: (page: number) => Observable<T[]>,
): Observable<T[]> {
  const walk = (page: number): Observable<T[]> =>
    fetchPage(page).pipe(
      switchMap((items) =>
        items.length === 0 ? of(items) : walk(page + 1).pipe(map((rest) => [...items, ...rest])),
      ),
    );

  return walk(1);
}

import { map, Observable, of, switchMap } from 'rxjs';

/**
 * Fetches items page by page, starting at page 1, and stops as soon as a page
 * returns no items. Pages are requested sequentially, and all items are
 * concatenated in page order.
 */
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

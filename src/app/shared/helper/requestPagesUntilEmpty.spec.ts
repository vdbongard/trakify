import { firstValueFrom, Observable, of, Subject, tap } from 'rxjs';
import { requestPagesUntilEmpty } from './requestPagesUntilEmpty';

describe('requestPagesUntilEmpty', () => {
  it('fetches page 1 and stops when the page is already empty', async () => {
    const fetchPage = (page: number): Observable<number[]> => of(page === 1 ? [] : [99]);

    const result = await firstValueFrom(requestPagesUntilEmpty(fetchPage));

    expect(result).toEqual([]);
  });

  it('fetches a single page and stops when the following page is empty', async () => {
    const fetchPage = (page: number): Observable<number[]> => of(page === 1 ? [1, 2] : []);

    const result = await firstValueFrom(requestPagesUntilEmpty(fetchPage));

    expect(result).toEqual([1, 2]);
  });

  it('walks additional pages until an empty page and concatenates in order', async () => {
    const fetchPage = (page: number): Observable<number[]> => {
      if (page === 1) return of([1, 2]);
      if (page === 2) return of([3, 4]);
      if (page === 3) return of([5, 6]);
      return of([]);
    };

    const result = await firstValueFrom(requestPagesUntilEmpty(fetchPage));

    expect(result).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('requests pages sequentially, waiting for each page before the next', async () => {
    const requestedPages: number[] = [];

    const fetchPage = (page: number): Observable<number[]> =>
      of(page === 3 ? [] : [page]).pipe(tap(() => requestedPages.push(page)));

    const result = await firstValueFrom(requestPagesUntilEmpty(fetchPage));

    expect(requestedPages).toEqual([1, 2, 3]);
    expect(result).toEqual([1, 2]);
  });

  it('does not fetch another page while a page is still pending', async () => {
    const pending = new Subject<number[]>();
    const requestedPages: number[] = [];

    const fetchPage = (page: number): Observable<number[]> => {
      requestedPages.push(page);
      if (page === 1) return pending.asObservable();
      return of([]);
    };

    const promise = firstValueFrom(requestPagesUntilEmpty(fetchPage));

    expect(requestedPages).toEqual([1]);
    pending.next([1, 2]);
    pending.complete();
    const result = await promise;

    expect(requestedPages).toEqual([1, 2]);
    expect(result).toEqual([1, 2]);
  });
});

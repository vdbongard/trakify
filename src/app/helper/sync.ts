import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, retry, Subscription } from 'rxjs';
import { getLocalStorage, setLocalStorage } from './local-storage';
import { Config } from '../config';
import { LocalStorage } from '../../types/enum';

export function syncCustomArray<T>({
  providers: [http],
  url,
  localStorageKey,
}: {
  localStorageKey: string;
  providers: [HttpClient];
  url?: string;
}): [BehaviorSubject<T[]>, () => Promise<void>] {
  const subject$ = new BehaviorSubject<T[]>(
    // @ts-ignore
    getLocalStorage<{ shows: T }>(localStorageKey)?.shows || []
  );

  function fetch(): Observable<T[]> {
    if (!url) return of([]);
    return http.get<T[]>(`${Config.traktBaseUrl}${url}`, Config.traktOptions);
  }

  function sync(): Promise<void> {
    return new Promise((resolve) => {
      if (!url) {
        resolve();
        return;
      }

      fetch().subscribe(async (result) => {
        setLocalStorage<{ shows: T[] }>(localStorageKey, {
          shows: result,
        });
        subject$.next(result);
        resolve();
      });
    });
  }

  return [subject$, sync];
}

export function syncCustomObject<T>({
  providers: [http],
  url,
  localStorageKey,
  idFormatter,
}: {
  providers: [HttpClient];
  localStorageKey: string;
  idFormatter?: (...args: unknown[]) => string;
  url?: string;
}): [
  BehaviorSubject<{ [id: number]: T }>,
  (...args: unknown[]) => Promise<void>,
  (...args: unknown[]) => Observable<T>
] {
  const subject$ = new BehaviorSubject<{ [id: string]: T }>(
    getLocalStorage<{ [id: number]: T }>(localStorageKey) || {}
  );
  const subjectSubscriptions$ = new BehaviorSubject<{ [id: string]: Subscription }>({});

  function fetch(...args: unknown[]): Observable<T> {
    if (!url) return of({} as T);
    const urlReplaced = url;

    args.forEach((arg) => {
      url.replace('%', arg as string);
    });

    return http
      .get<T>(`${Config.traktBaseUrl}${urlReplaced}`, Config.traktOptions)
      .pipe(retry({ count: 3, delay: 2000 }));
  }

  async function sync(...args: unknown[]): Promise<void> {
    return new Promise((resolve) => {
      if (!url) {
        resolve();
        return;
      }

      const argsExisting = args.map((arg) => arg !== undefined);
      if (argsExisting.includes(false)) {
        resolve();
        return;
      }
      const id = idFormatter ? idFormatter(...(args as number[])) : (args[0] as string);
      const values = subject$.value;
      const value = values[id];
      const subscriptions = subjectSubscriptions$.value;
      const subscription = subscriptions[id];
      const isExisting = value || subscription;

      if (isExisting) {
        resolve();
        return;
      }

      subscriptions[id] = fetch(id).subscribe((result) => {
        values[id] = result;
        setLocalStorage<{ [id: number]: T }>(LocalStorage.SHOWS_PROGRESS, values);
        subject$.next(values);
        delete subscriptions[id];
        subjectSubscriptions$.next(subscriptions);
        resolve();
      });
      subjectSubscriptions$.next(subscriptions);
    });
  }

  return [subject$, (...args): Promise<void> => sync(...args), fetch];
}

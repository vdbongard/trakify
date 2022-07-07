import { BehaviorSubject, Observable, of, retry, Subscription } from 'rxjs';
import { getLocalStorage, setLocalStorage } from './local-storage';
import { LocalStorage } from '../../types/enum';
import { Config } from '../config';
import {
  Params,
  ParamsFull,
  ParamsFullObject,
  ReturnValueArray,
  ReturnValueObject,
  ReturnValueObjects,
} from '../../types/interfaces/Sync';

export function syncCustomArray<T>({
  localStorageKey,
  providers: [http],
  url,
  baseUrl,
  httpOptions,
}: ParamsFull): ReturnValueArray<T> {
  const subject$ = new BehaviorSubject<T[]>(
    // @ts-ignore
    getLocalStorage<{ shows: T }>(localStorageKey)?.shows || []
  );

  function fetch(): Observable<T[]> {
    if (!url) return of([]);
    return http.get<T[]>(`${baseUrl}${url}`, httpOptions);
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
  localStorageKey,
  providers: [http],
  url,
  baseUrl,
  httpOptions,
}: ParamsFullObject): ReturnValueObject<T> {
  const subject$ = new BehaviorSubject<T | undefined>(getLocalStorage<T>(localStorageKey));

  function fetch(...args: unknown[]): Observable<T | undefined> {
    if (!url) return of(undefined);
    let urlReplaced = url;

    args.forEach((arg) => {
      urlReplaced = url.replace('%', arg as string);
    });

    return http
      .get<T>(`${baseUrl}${urlReplaced}`, httpOptions)
      .pipe(retry({ count: 3, delay: 2000 }));
  }

  async function sync(): Promise<void> {
    return new Promise((resolve) => {
      if (!url) {
        resolve();
        return;
      }

      fetch().subscribe(async (result) => {
        setLocalStorage<T>(localStorageKey, result as T);
        subject$.next(result);
        resolve();
      });
    });
  }

  return [subject$, (): Promise<void> => sync()];
}

export function syncCustomObjects<T>({
  localStorageKey,
  providers: [http],
  idFormatter,
  url,
  baseUrl,
  httpOptions,
}: ParamsFullObject): ReturnValueObjects<T> {
  const subject$ = new BehaviorSubject<{ [id: string]: T }>(
    getLocalStorage<{ [id: number]: T }>(localStorageKey) || {}
  );
  const subjectSubscriptions$ = new BehaviorSubject<{ [id: string]: Subscription }>({});

  function fetch(...args: unknown[]): Observable<T> {
    if (!url) return of({} as T);
    let urlReplaced = url;

    args.forEach((arg) => {
      urlReplaced = url.replace('%', arg as string);
    });

    return http
      .get<T>(`${baseUrl}${urlReplaced}`, httpOptions)
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

export function syncCustomArrayTrakt<T>(params: Params): ReturnValueArray<T> {
  return syncCustomArray({
    ...params,
    baseUrl: Config.traktBaseUrl,
    httpOptions: Config.traktOptions,
  });
}

export function syncCustomObjectTrakt<T>(params: ParamsFullObject): ReturnValueObject<T> {
  return syncCustomObject({
    ...params,
    baseUrl: Config.traktBaseUrl,
    httpOptions: Config.traktOptions,
  });
}

export function syncCustomObjectsTrakt<T>(params: ParamsFullObject): ReturnValueObjects<T> {
  return syncCustomObjects({
    ...params,
    baseUrl: Config.traktBaseUrl,
    httpOptions: Config.traktOptions,
  });
}

export function syncCustomArrayTmdb<T>(params: Params): ReturnValueArray<T> {
  return syncCustomArray({
    ...params,
    baseUrl: Config.tmdbBaseUrl,
    httpOptions: Config.tmdbOptions,
  });
}

export function syncCustomObjectTmdb<T>(params: ParamsFullObject): ReturnValueObject<T> {
  return syncCustomObject({
    ...params,
    baseUrl: Config.tmdbBaseUrl,
    httpOptions: Config.tmdbOptions,
  });
}

export function syncCustomObjectsTmdb<T>(params: ParamsFullObject): ReturnValueObjects<T> {
  return syncCustomObjects({
    ...params,
    baseUrl: Config.tmdbBaseUrl,
    httpOptions: Config.tmdbOptions,
  });
}

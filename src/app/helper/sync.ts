import { BehaviorSubject, map, Observable, of, retry } from 'rxjs';
import { getLocalStorage, setLocalStorage } from './localStorage';
import { Config } from '../config';
import {
  Params,
  ParamsFull,
  ParamsFullObject,
  ParamsFullObjectWithDefault,
  ReturnValueArray,
  ReturnValueObject,
  ReturnValueObjects,
  ReturnValueObjectWithDefault,
  ReturnValuesArrays,
} from '../../types/interfaces/Sync';
import { HttpClient } from '@angular/common/http';
import { errorDelay } from './errorDelay';

export function syncArray<T>({
  localStorageKey,
  http,
  url,
  baseUrl,
}: ParamsFull): ReturnValueArray<T> {
  const subject$ = new BehaviorSubject<T[]>(
    // @ts-ignore
    getLocalStorage<{ shows: T }>(localStorageKey)?.shows || []
  );

  function fetch(): Observable<T[]> {
    if (!url || !http) return of([]);
    return (http as HttpClient).get<T[]>(`${baseUrl}${url}`).pipe(
      retry({
        count: 3,
        delay: errorDelay,
      })
    );
  }

  function sync(): Observable<void> {
    if (!url) return of(undefined);

    return fetch().pipe(
      map((result) => {
        setLocalStorage<{ shows: T[] }>(localStorageKey, {
          shows: result,
        });
        subject$.next(result);
      })
    );
  }

  return [subject$, sync];
}

export function syncObject<T>({
  localStorageKey,
  http,
  url,
  baseUrl,
}: ParamsFullObject): ReturnValueObject<T> {
  const subject$ = new BehaviorSubject<T | undefined>(getLocalStorage<T>(localStorageKey));

  function fetch(): Observable<T | undefined> {
    if (!url || !http) return of(undefined);

    return (http as HttpClient).get<T>(`${baseUrl}${url}`).pipe(
      retry({
        count: 3,
        delay: errorDelay,
      })
    );
  }

  function sync(): Observable<void> {
    if (!url) {
      const result = subject$.value;
      if (result) setValue<T>(subject$, result, localStorageKey);
      return of(undefined);
    }

    return fetch().pipe(
      map((result) => {
        setValue<T>(subject$, result, localStorageKey);
      })
    );
  }

  return [subject$, (): Observable<void> => sync()];
}

export function syncObjectWithDefault<T extends Record<string, unknown>>(
  params: ParamsFullObjectWithDefault<T>
): ReturnValueObjectWithDefault<T> {
  const [subject$, sync] = syncObject<T>({ ...params });

  const value = subject$.value;

  if (!value) {
    subject$.next(params.default);
  }

  addMissingValues<T>(subject$, params.default);

  return [subject$ as BehaviorSubject<T>, sync];
}

export function syncObjects<T>({
  localStorageKey,
  http,
  idFormatter,
  url,
  baseUrl,
  ignoreExisting,
}: ParamsFullObject): ReturnValueObjects<T> {
  const subject$ = new BehaviorSubject<{ [id: string]: T }>(
    getLocalStorage<{ [id: number]: T }>(localStorageKey) || {}
  );

  function fetch(...args: unknown[]): Observable<T> {
    if (!url || !http) return of({} as T);
    let urlReplaced = url;

    const sync = args[args.length - 1] === true;
    if (sync) args.splice(args.length - 1, 1);

    args.forEach((arg) => {
      urlReplaced = urlReplaced.replace('%', arg as string);
    });

    return (http as HttpClient).get<T>(`${baseUrl}${urlReplaced}`).pipe(
      map((res) => {
        const value = Array.isArray(res) ? (res as T[])[0] : res;
        if (sync) {
          const id = idFormatter ? idFormatter(...(args as number[])) : (args[0] as string);
          syncValue(value, id);
        }
        return value;
      })
    );
  }

  function sync(...args: unknown[]): Observable<void> {
    if (!url) return of(undefined);

    const force = args[args.length - 1] === true;
    if (force) args.splice(args.length - 1, 1);

    const id = idFormatter ? idFormatter(...(args as number[])) : (args[0] as string);
    const values = subject$.value;

    const isExisting = !!values[id];

    if (!force && !ignoreExisting && isExisting) return of(undefined);

    return fetch(...args).pipe(
      map((result) => {
        syncValue(result, id);
      })
    );
  }

  function syncValue(result: T, id: string): void {
    const values = subject$.value;
    values[id] = result || ({} as T);
    setLocalStorage<{ [id: number]: T }>(localStorageKey, values);
    subject$.next(values);
  }

  return [subject$, (...args): Observable<void> => sync(...args), fetch];
}

export function syncArrays<T>({
  localStorageKey,
  http,
  idFormatter,
  url,
  baseUrl,
  ignoreExisting,
}: ParamsFullObject): ReturnValuesArrays<T> {
  const subject$ = new BehaviorSubject<{ [id: string]: T[] }>(
    getLocalStorage<{ [id: string]: T[] }>(localStorageKey) || {}
  );

  function fetch(...args: unknown[]): Observable<T[]> {
    if (!url || !http) return of([] as T[]);
    let urlReplaced = url;

    const sync = args[args.length - 1] === true;
    if (sync) args.splice(args.length - 1, 1);

    args.forEach((arg) => {
      urlReplaced = urlReplaced.replace('%', arg as string);
    });

    return (http as HttpClient).get<T[]>(`${baseUrl}${urlReplaced}`);
  }

  function sync(...args: unknown[]): Observable<void> {
    if (!url) return of(undefined);

    const force = args[args.length - 1] === true;
    if (force) args.splice(args.length - 1, 1);

    const id = idFormatter ? idFormatter(...(args as number[])) : (args[0] as string);
    const values = subject$.value;
    const value = values[id];
    const isExisting = !!value;

    if (!force && !ignoreExisting && isExisting) return of(undefined);

    return fetch(...args).pipe(
      map((result) => {
        values[id] = result || ([] as T[]);
        setLocalStorage<{ [id: string]: T[] }>(localStorageKey, values);
        subject$.next(values);
      })
    );
  }

  return [subject$, (...args): Observable<void> => sync(...args), fetch];
}

export function syncArrayTrakt<T>(params: Params): ReturnValueArray<T> {
  return syncArray({
    ...params,
    baseUrl: Config.traktBaseUrl,
  });
}

export function syncObjectsTrakt<T>(params: ParamsFullObject): ReturnValueObjects<T> {
  return syncObjects({
    ...params,
    baseUrl: Config.traktBaseUrl,
  });
}

export function syncArraysTrakt<T>(params: ParamsFullObject): ReturnValuesArrays<T> {
  return syncArrays({
    ...params,
    baseUrl: Config.traktBaseUrl,
  });
}

export function syncObjectTmdb<T>(params: ParamsFullObject): ReturnValueObject<T> {
  return syncObject({
    ...params,
    baseUrl: Config.tmdbBaseUrl,
  });
}

export function syncObjectsTmdb<T>(params: ParamsFullObject): ReturnValueObjects<T> {
  return syncObjects({
    ...params,
    baseUrl: Config.tmdbBaseUrl,
  });
}

export function setValue<T>(
  subject$: BehaviorSubject<T | undefined>,
  result: T | undefined,
  localStorageKey: string
): void {
  setLocalStorage<T>(localStorageKey, result as T);
  subject$.next(result);
}

function addMissingValues<T extends Record<string, unknown>>(
  subject$: BehaviorSubject<T | undefined>,
  defaultValues: T
): void {
  const value: Record<string, unknown> | undefined = subject$?.value;
  if (!value) return;

  Object.entries(defaultValues).map(([key, defaultValue]) => {
    if (!value[key]) {
      value[key] = defaultValue;
    }
  });

  subject$.next(value as T);
}

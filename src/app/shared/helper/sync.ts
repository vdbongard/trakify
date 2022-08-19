import { BehaviorSubject, catchError, map, Observable, of, retry, throwError } from 'rxjs';
import { getLocalStorage, setLocalStorage } from './localStorage';
import { Config } from '../../config';
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
  SyncOptions,
} from '../../../types/interfaces/Sync';
import { HttpClient } from '@angular/common/http';
import { errorDelay } from './errorDelay';
import { isObject } from './isObject';
import { mergeDeep } from './deepMerge';
import { LocalStorage } from '../../../types/enum';

function fetch<S>(
  subject$: BehaviorSubject<unknown>,
  localStorageKey: LocalStorage,
  baseUrl?: string,
  url?: string,
  http?: HttpClient,
  idFormatter?: (...args: unknown[]) => string,
  ...args: unknown[]
): Observable<S> {
  if (!url || !http) throw Error('Url or http is empty');
  if (args.includes(null)) throw Error('Argument is null');
  let urlReplaced = url;

  const sync = args[args.length - 1] === true;
  if (sync) args.splice(args.length - 1, 1);

  args.forEach((arg) => {
    urlReplaced = urlReplaced.replace('%', arg as string);
  });

  return (http as HttpClient).get<S>(`${baseUrl}${url}`).pipe(
    map((res) => {
      const value = Array.isArray(res) ? (res as S[])[0] : res;
      if (sync) {
        const id = idFormatter ? idFormatter(...(args as number[])) : (args[0] as string);
        syncValue(
          subject$ as BehaviorSubject<{ [id: string]: unknown }>,
          localStorageKey,
          value,
          id
        );
      }
      return value;
    }),
    catchError((error) => {
      if (sync) {
        const id = idFormatter ? idFormatter(...(args as number[])) : (args[0] as string);
        syncValue(
          subject$ as BehaviorSubject<{ [id: string]: unknown }>,
          localStorageKey,
          undefined,
          id
        );
      }
      return throwError(error);
    }),
    retry({
      count: 3,
      delay: errorDelay,
    })
  );
}

function syncValue<S>(
  subject$: BehaviorSubject<{ [id: string]: unknown }>,
  localStorageKey: LocalStorage,
  result: S | undefined,
  id: string,
  options?: SyncOptions
): void {
  const values = subject$.value;
  values[id] = result ?? {};
  setLocalStorage<unknown>(localStorageKey, values);
  if (options?.publishSingle) {
    console.debug('publish objects', localStorageKey);
    subject$.next(values);
  }
}

export function syncArray<T>({
  localStorageKey,
  http,
  url,
  baseUrl,
}: ParamsFull): ReturnValueArray<T> {
  type Array<T> = { _: T[] };
  const subject$ = new BehaviorSubject<T[]>(getLocalStorage<Array<T>>(localStorageKey)?._ ?? []);

  function sync(options: SyncOptions = { publishSingle: true }): Observable<void> {
    if (!url) {
      const result = subject$.value;
      if (result) {
        setLocalStorage<Array<T>>(localStorageKey, { _: result });
        if (options.publishSingle) {
          console.debug('publish object', url);
          subject$.next(result);
        }
      }
      return of(undefined);
    }

    return fetch<T[]>(
      subject$ as BehaviorSubject<unknown>,
      localStorageKey,
      baseUrl,
      url,
      http,
      undefined
    ).pipe(
      map((result) => {
        setLocalStorage<Array<T>>(localStorageKey, { _: result });
        if (options.publishSingle) {
          console.debug('publish array', url);
          subject$.next(result);
        }
      })
    );
  }

  return { $: subject$, sync };
}

export function syncObject<T>({
  localStorageKey,
  http,
  url,
  baseUrl,
}: ParamsFullObject): ReturnValueObject<T> {
  const subject$ = new BehaviorSubject<T | undefined>(getLocalStorage<T>(localStorageKey));

  function sync(options: SyncOptions = { publishSingle: true }): Observable<void> {
    if (!url) {
      const result = subject$.value;
      if (result) {
        setLocalStorage<T>(localStorageKey, result);
        if (options.publishSingle) {
          console.debug('publish object', url);
          subject$.next(result);
        }
      }
      return of(undefined);
    }

    return fetch<T>(
      subject$ as BehaviorSubject<unknown>,
      localStorageKey,
      baseUrl,
      url,
      http,
      undefined
    ).pipe(
      map((result) => {
        setLocalStorage<T>(localStorageKey, result);
        options.publishSingle && subject$.next(result);
      })
    );
  }

  return { $: subject$, sync };
}

export function syncObjectWithDefault<T extends Record<string, unknown>>(
  params: ParamsFullObjectWithDefault<T>
): ReturnValueObjectWithDefault<T> {
  const { $: subject$, sync } = syncObject<T>({ ...params });

  const value = subject$.value;

  if (!value) {
    subject$.next(params.default);
  }

  addMissingValues<T>(subject$, params.default);

  return { $: subject$ as BehaviorSubject<T>, sync };
}

export function syncObjects<T>({
  localStorageKey,
  http,
  idFormatter,
  url,
  baseUrl,
  ignoreExisting,
}: ParamsFullObject): ReturnValueObjects<T> {
  const subject$ = new BehaviorSubject<{ [id: string]: T | undefined }>(
    getLocalStorage<{ [id: number]: T }>(localStorageKey) ?? {}
  );

  function sync(...args: unknown[]): Observable<void> {
    if (!url) return of(undefined);

    const options = isObject(args[args.length - 1])
      ? (args[args.length - 1] as SyncOptions)
      : undefined;
    if (options || args[args.length - 1] === undefined) args.splice(args.length - 1, 1);

    const id = idFormatter ? idFormatter(...(args as number[])) : (args[0] as string);
    const values = subject$.value;

    const isExisting = !!values[id];

    if (!options?.force && !ignoreExisting && isExisting) return of(undefined);

    return fetch<T>(
      subject$ as BehaviorSubject<unknown>,
      localStorageKey,
      baseUrl,
      url,
      http,
      idFormatter,
      ...args
    ).pipe(
      map((result) =>
        syncValue(
          subject$ as BehaviorSubject<{ [id: string]: unknown }>,
          localStorageKey,
          result,
          id,
          options
        )
      )
    );
  }

  return {
    $: subject$,
    sync: (...args): Observable<void> => sync(...args),
    fetch: (...args) =>
      fetch(
        subject$ as BehaviorSubject<unknown>,
        localStorageKey,
        baseUrl,
        url,
        http,
        idFormatter,
        ...args
      ),
  };
}

export function syncArrays<T>({
  localStorageKey,
  http,
  idFormatter,
  url,
  baseUrl,
  ignoreExisting,
}: ParamsFullObject): ReturnValuesArrays<T> {
  const subject$ = new BehaviorSubject<{ [id: string]: T[] | undefined }>(
    getLocalStorage<{ [id: string]: T[] }>(localStorageKey) ?? {}
  );

  function sync(...args: unknown[]): Observable<void> {
    if (!url) return of(undefined);

    const options = isObject(args[args.length - 1])
      ? (args[args.length - 1] as SyncOptions)
      : undefined;
    if (options || args[args.length - 1] === undefined) args.splice(args.length - 1, 1);

    const id = idFormatter ? idFormatter(...(args as number[])) : (args[0] as string);
    const values = subject$.value;
    const value = values[id];
    const isExisting = !!value;

    if (!options?.force && !ignoreExisting && isExisting) return of(undefined);

    return fetch<T>(
      subject$ as BehaviorSubject<unknown>,
      localStorageKey,
      baseUrl,
      url,
      http,
      idFormatter,
      ...args
    ).pipe(
      map((result) => {
        syncValue<T>(
          subject$ as BehaviorSubject<{ [id: string]: unknown }>,
          localStorageKey,
          result,
          id,
          options
        );
      })
    );
  }

  return {
    $: subject$,
    sync: (...args): Observable<void> => sync(...args),
    fetch: (...args) =>
      fetch(
        subject$ as BehaviorSubject<unknown>,
        localStorageKey,
        baseUrl,
        url,
        http,
        idFormatter,
        ...args
      ),
  };
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

function addMissingValues<T extends Record<string, unknown>>(
  subject$: BehaviorSubject<T | undefined>,
  defaultValues: T
): void {
  let value: Record<string, unknown> | undefined = subject$?.value;
  if (!value) return;

  value = mergeDeep(defaultValues, value);

  subject$.next(value as T);
}

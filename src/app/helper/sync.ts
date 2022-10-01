import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, catchError, map, Observable, of, retry, throwError } from 'rxjs';
import { getLocalStorage, setLocalStorage } from './localStorage';
import { errorDelay } from './errorDelay';
import { isObject } from './isObject';
import { mergeDeep } from './deepMerge';

import type { LocalStorage } from '@type/enum';
import type {
  ParamsFull,
  ParamsFullObject,
  ParamsFullObjectWithDefault,
  ReturnValueArray,
  ReturnValueObject,
  ReturnValueObjects,
  ReturnValueObjectWithDefault,
  ReturnValuesArrays,
  SyncOptions,
  SyncType,
} from '@type/interfaces/Sync';
import { parseResponse } from '@operator/parseResponse';
import { ZodSchema } from 'zod';
import { urlReplace } from '@helper/urlReplace';

function fetch<S>(
  type: SyncType,
  $: BehaviorSubject<unknown>,
  localStorageKey: LocalStorage,
  schema?: ZodSchema,
  url?: string,
  http?: HttpClient,
  idFormatter?: (...args: unknown[]) => string,
  ...args: unknown[]
): Observable<S> {
  if (!url || !http) throw Error('Url or http is empty (fetch)');
  if (args.includes(null)) throw Error('Argument is null (fetch)');

  const sync = args[args.length - 1] === true;
  if (sync) args.splice(args.length - 1, 1);

  return http.get<S>(urlReplace(url, args)).pipe(
    map((res) => {
      const value = type === 'objects' && Array.isArray(res) ? (res as S[])[0] : res;
      if (sync) {
        const id = idFormatter ? idFormatter(...(args as number[])) : (args[0] as string);
        syncValue(type, $, localStorageKey, value, id, { publishSingle: false });
      }
      return value;
    }),
    parseResponse(schema),
    catchError((error) => {
      if (sync) {
        const id = idFormatter ? idFormatter(...(args as number[])) : (args[0] as string);
        syncValue(type, $, localStorageKey, undefined, id, { publishSingle: false });
      }
      return throwError(() => error);
    }),
    retry({
      count: 2,
      delay: errorDelay,
    })
  );
}

function sync<S>(
  type: SyncType,
  $: BehaviorSubject<unknown>,
  localStorageKey: LocalStorage,
  schema?: ZodSchema,
  url?: string,
  http?: HttpClient,
  idFormatter?: (...args: unknown[]) => string,
  ignoreExisting?: boolean,
  ...args: unknown[]
): Observable<void> {
  const options = isObject(args[args.length - 1])
    ? (args[args.length - 1] as SyncOptions)
    : undefined;
  if (options || args[args.length - 1] === undefined) args.splice(args.length - 1, 1);

  const id = idFormatter ? idFormatter(...(args as number[])) : (args[0] as string);

  if (!url) {
    const result = $.value;
    syncValue(type, $, localStorageKey, result, id, options);
    return of(undefined);
  }

  let isExisting = false;
  switch (type) {
    case 'object':
    case 'array':
      break;
    case 'objects':
    case 'arrays':
      isExisting = !!($.value as { [id: string]: unknown })[id];
      break;
    default:
      throw Error('Type not known (sync)');
  }

  if (options?.deleteOld && type === 'objects') {
    const values = $.value as { [id: string]: S };
    const oldValues = Object.entries(values).filter(
      ([valueId]) => valueId !== id && valueId.startsWith(`${id.split('-')[0]}-`)
    );

    oldValues.forEach(([valueId, value]) => {
      console.debug('old value:', valueId, value);
      delete values[valueId];
    });

    if (oldValues.length) {
      $.next(values);
      setLocalStorage<unknown>(localStorageKey, $.value);
    }
  }

  if (!options?.force && !ignoreExisting && isExisting) return of(undefined);

  return fetch<S>(
    type,
    $ as BehaviorSubject<unknown>,
    localStorageKey,
    schema,
    url,
    http,
    idFormatter,
    ...args
  ).pipe(map((result) => syncValue(type, $, localStorageKey, result, id, options)));
}

function syncValue<S>(
  type: SyncType,
  $: BehaviorSubject<unknown>,
  localStorageKey: LocalStorage,
  result: unknown,
  id: string,
  options: SyncOptions = { publishSingle: true }
): void {
  switch (type) {
    case 'object':
    case 'array':
      break;
    case 'objects':
      ($.value as { [id: string]: S })[id] = (result as S) ?? ({} as S);
      break;
    case 'arrays':
      ($.value as { [id: string]: S[] })[id] = (result as S[]) ?? [];
      break;
    default:
      throw Error('Type not known (syncValue)');
  }
  if (options.publishSingle) {
    console.debug('publish', localStorageKey);
    switch (type) {
      case 'object':
      case 'array':
        $.next(result);
        break;
      case 'objects':
      case 'arrays':
        $.next($.value);
        break;
      default:
        throw Error('Type not known (syncValue)');
    }
  }
  setLocalStorage<unknown>(localStorageKey, $.value);
}

export function syncArray<T>({
  localStorageKey,
  schema,
  http,
  url,
}: ParamsFull): ReturnValueArray<T> {
  const localStorageValue = getLocalStorage<T[]>(localStorageKey);
  const $ = new BehaviorSubject<T[] | undefined>(
    Array.isArray(localStorageValue) ? localStorageValue : undefined
  );
  return {
    $,
    sync: (options) =>
      sync(
        'array',
        $ as BehaviorSubject<unknown>,
        localStorageKey,
        schema,
        url,
        http,
        undefined,
        undefined,
        options
      ),
  };
}

export function syncObject<T>({
  localStorageKey,
  schema,
  http,
  url,
}: ParamsFullObject): ReturnValueObject<T> {
  const $ = new BehaviorSubject<T | undefined>(getLocalStorage<T>(localStorageKey));
  return {
    $,
    sync: (options) =>
      sync(
        'object',
        $ as BehaviorSubject<unknown>,
        localStorageKey,
        schema,
        url,
        http,
        undefined,
        undefined,
        options
      ),
  };
}

export function syncObjectWithDefault<T extends Record<string, unknown>>(
  params: ParamsFullObjectWithDefault<T>
): ReturnValueObjectWithDefault<T> {
  const { $, sync } = syncObject<T>({ ...params });

  if (!$.value) {
    $.next(params.default);
  }

  addMissingValues<T>($, params.default);

  return { $: $ as BehaviorSubject<T>, sync };
}

export function syncObjects<T>({
  localStorageKey,
  schema,
  http,
  idFormatter,
  url,
  ignoreExisting,
}: ParamsFullObject): ReturnValueObjects<T> {
  const $ = new BehaviorSubject<{ [id: string]: T | undefined }>(
    getLocalStorage<{ [id: number]: T }>(localStorageKey) ?? {}
  );
  return {
    $,
    sync: (...args): Observable<void> =>
      sync(
        'objects',
        $ as BehaviorSubject<unknown>,
        localStorageKey,
        schema,
        url,
        http,
        idFormatter,
        ignoreExisting,
        ...args
      ),
    fetch: (...args) =>
      fetch(
        'objects',
        $ as BehaviorSubject<unknown>,
        localStorageKey,
        schema,
        url,
        http,
        idFormatter,
        ...args
      ),
  };
}

export function syncArrays<T>({
  localStorageKey,
  schema,
  http,
  idFormatter,
  url,
  ignoreExisting,
}: ParamsFullObject): ReturnValuesArrays<T> {
  const $ = new BehaviorSubject<{ [id: string]: T[] | undefined }>(
    getLocalStorage<{ [id: string]: T[] }>(localStorageKey) ?? {}
  );
  return {
    $,
    sync: (...args): Observable<void> =>
      sync(
        'arrays',
        $ as BehaviorSubject<unknown>,
        localStorageKey,
        schema,
        url,
        http,
        idFormatter,
        ignoreExisting,
        ...args
      ),
    fetch: (...args) =>
      fetch(
        'arrays',
        $ as BehaviorSubject<unknown>,
        localStorageKey,
        schema,
        url,
        http,
        idFormatter,
        ...args
      ),
  };
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

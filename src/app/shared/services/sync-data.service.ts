import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import {
  FetchPersistOptions,
  Params,
  ParamsArrayPaged,
  ParamsMap,
  ParamsObject,
  ParamsObjectWithDefault,
  ReturnValueArray,
  ReturnValueMap,
  ReturnValueObject,
  ReturnValueObjects,
  ReturnValueObjectWithDefault,
  ReturnValuesArrays,
  SyncIds,
  SyncOptions,
  SyncType,
} from '@type/Sync';
import { catchError, finalize, map, Observable, of, shareReplay, throwError } from 'rxjs';
import { LocalStorage } from '@type/Enum';
import { LocalStorageService } from '@services/local-storage.service';
import { ZodSchema } from 'zod';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { toUrl } from '@helper/toUrl';
import { parseResponse } from '@operator/parseResponse';
import { rateLimit } from '@operator/rateLimit';
import { isObject } from '@helper/isObject';
import { mergeDeepCustom } from '@helper/deepMerge';
import { requestPagesUntilEmpty } from '@helper/requestPagesUntilEmpty';

@Injectable({
  providedIn: 'root',
})
export class SyncDataService {
  localStorageService = inject(LocalStorageService);
  http = inject(HttpClient);

  /** In-flight requests keyed by request URL so concurrent callers share one HTTP call. */
  private readonly inFlightFetches = new Map<string, Observable<unknown>>();

  syncArray<T>({ localStorageKey, schema, url }: Params): ReturnValueArray<T> {
    const s = signal<T[]>([]);

    this.initArrayFromStorage(s, localStorageKey);

    return {
      s,
      sync: (options) =>
        this.sync(
          'array',
          s as WritableSignal<unknown>,
          localStorageKey,
          schema,
          url,
          undefined,
          undefined,
          undefined,
          [],
          options,
        ),
      flush: (): void => this.flush('array', s as WritableSignal<unknown>, localStorageKey),
    };
  }

  syncObject<T>({ localStorageKey, schema, url }: ParamsObject<T>): ReturnValueObject<T> {
    const s = signal<T | undefined>(undefined);

    if (localStorageKey) {
      const localStorageValue = this.localStorageService.getObject<T>(localStorageKey);
      if (localStorageValue) {
        s.set(localStorageValue);
      }
    }

    return {
      s,
      sync: (options) =>
        this.sync(
          'object',
          s as WritableSignal<unknown>,
          localStorageKey,
          schema,
          url,
          undefined,
          undefined,
          undefined,
          [],
          options,
        ),
      flush: (): void => this.flush('object', s as WritableSignal<unknown>, localStorageKey),
    };
  }

  syncObjectWithDefault<T extends Record<string, unknown>>(
    params: ParamsObjectWithDefault<T>,
  ): ReturnValueObjectWithDefault<T> {
    const { s, sync, flush } = this.syncObject<T>({ ...params });

    if (!s()) {
      s.set({ ...params.default });
    }

    this.addMissingValues<T>(s, params.default);

    return { s: s as WritableSignal<T>, sync, flush };
  }

  syncObjects<T>({
    localStorageKey,
    schema,
    idFormatter,
    url,
    ignoreExisting,
    parseItem,
  }: ParamsObject<T>): ReturnValueObjects<T> {
    const s = signal<Record<string, T | undefined>>({});

    if (localStorageKey) {
      const localStorageValue =
        this.localStorageService.getObject<Record<string, T>>(localStorageKey);

      if (localStorageValue && isObject(localStorageValue)) {
        s.set(localStorageValue);
      }
    }

    const store = s as WritableSignal<unknown>;
    return {
      s,
      syncIds: (ids: SyncIds, options?: SyncOptions): Observable<void> =>
        this.sync(
          'objects',
          store,
          localStorageKey,
          schema,
          url,
          idFormatter,
          ignoreExisting,
          parseItem,
          [...ids],
          options,
        ),
      fetchIds: (ids: SyncIds, options?: FetchPersistOptions): Observable<T | undefined> =>
        this.fetch(
          'objects',
          store,
          localStorageKey,
          schema,
          url,
          idFormatter,
          parseItem,
          [...ids],
          options?.persist === true,
        ),
      evictWhere: (predicate: (key: string) => boolean): void =>
        this.evictRecord(s as WritableSignal<Record<string, unknown>>, localStorageKey, predicate),
      flush: (): void => this.flush('objects', store, localStorageKey),
    };
  }

  syncArrays<T>({
    localStorageKey,
    schema,
    idFormatter,
    url,
    ignoreExisting,
    parseItem,
  }: ParamsObject<T[]>): ReturnValuesArrays<T> {
    const s = signal<Record<string, T[] | undefined>>({});

    if (localStorageKey) {
      const localStorageValue =
        this.localStorageService.getObject<Record<string, T[]>>(localStorageKey);

      if (localStorageValue && isObject(localStorageValue)) {
        s.set(localStorageValue);
      }
    }

    const store = s as WritableSignal<unknown>;
    return {
      s,
      syncIds: (ids: SyncIds, options?: SyncOptions): Observable<void> =>
        this.sync(
          'arrays',
          store,
          localStorageKey,
          schema,
          url,
          idFormatter,
          ignoreExisting,
          parseItem,
          [...ids],
          options,
        ),
      fetchIds: (ids: SyncIds, options?: FetchPersistOptions): Observable<T[] | undefined> =>
        this.fetch(
          'arrays',
          store,
          localStorageKey,
          schema,
          url,
          idFormatter,
          parseItem,
          [...ids],
          options?.persist === true,
        ) as Observable<T[] | undefined>,
      evictWhere: (predicate: (key: string) => boolean): void =>
        this.evictRecord(s as WritableSignal<Record<string, unknown>>, localStorageKey, predicate),
      flush: (): void => this.flush('arrays', store, localStorageKey),
    };
  }

  /**
   * Pages the endpoint until empty and builds an id-keyed record (`{ [id]: item }`) that
   * replaces the whole store — used for bulk, paginated lists such as the progress overview.
   */
  syncPagedRecord<T, TItem = T>({
    localStorageKey,
    schema,
    idFormatter,
    url,
    pageSize,
    parseItem,
  }: ParamsMap<T, TItem>): ReturnValueMap<T> {
    const s = signal<Record<string, T | undefined>>({});

    if (localStorageKey) {
      const localStorageValue =
        this.localStorageService.getObject<Record<string, T>>(localStorageKey);

      if (localStorageValue && isObject(localStorageValue)) {
        s.set(localStorageValue);
      }
    }

    return {
      s,
      sync: (): Observable<void> => {
        return this.fetchPages<TItem>(url, pageSize, schema).pipe(
          map((items) => {
            const record: Record<string, T> = {};
            items.forEach((item) => {
              const value = parseItem ? parseItem(item) : (item as unknown as T);
              record[idFormatter(item)] = value;
            });
            s.set(record);
            if (localStorageKey) {
              this.localStorageService.setObject(localStorageKey, record);
            }
          }),
        );
      },
      flush: (): void => this.flush('objects', s as WritableSignal<unknown>, localStorageKey),
    };
  }

  syncArrayPaged<T>({
    localStorageKey,
    schema,
    url,
    pageSize,
  }: ParamsArrayPaged): ReturnValueArray<T> {
    const s = signal<T[]>([]);

    this.initArrayFromStorage(s, localStorageKey);

    return {
      s,
      sync: (): Observable<void> => {
        return this.fetchPages<T>(url, pageSize, schema).pipe(
          map((items) => {
            s.set(items);
            if (localStorageKey) {
              this.localStorageService.setObject(localStorageKey, items);
            }
          }),
        );
      },
      flush: (): void => this.flush('array', s as WritableSignal<unknown>, localStorageKey),
    };
  }

  private fetchPages<T>(
    url: string | undefined,
    pageSize: number,
    schema?: ZodSchema,
  ): Observable<T[]> {
    if (!url) throw Error('Url is empty (fetch)');
    return requestPagesUntilEmpty((page: number) =>
      this.http.get<T[]>(toUrl(url, [page, pageSize])).pipe(parseResponse(schema), rateLimit()),
    );
  }

  private initArrayFromStorage<T>(s: WritableSignal<T[]>, localStorageKey?: LocalStorage): void {
    if (!localStorageKey) return;
    const localStorageValue = this.localStorageService.getObject<T[]>(localStorageKey);
    if (Array.isArray(localStorageValue)) {
      s.set(localStorageValue);
    }
  }

  private sync<S>(
    type: SyncType,
    s: WritableSignal<unknown>,
    localStorageKey?: LocalStorage,
    schema?: ZodSchema,
    url?: string,
    idFormatter?: (...args: unknown[]) => string,
    ignoreExisting?: boolean,
    parseItem?: (data: S) => S,
    ids: unknown[] = [],
    options?: SyncOptions,
  ): Observable<void> {
    const id = idFormatter ? idFormatter(...ids) : (ids[0] as string);

    if (!url) {
      const result = s();
      this.syncValue(type, s, localStorageKey, result, id, options);
      return of(undefined);
    }

    let isExisting = false;
    switch (type) {
      case 'object':
      case 'array':
        break;
      case 'objects':
      case 'arrays':
        isExisting = !!(s() as Record<string, unknown>)[id];
        break;
      default:
        throw Error('Type not known (sync)');
    }

    if (!options?.force && !ignoreExisting && isExisting) return of(undefined);

    return this.fetch<S>(
      type,
      s,
      localStorageKey,
      schema,
      url,
      idFormatter,
      parseItem,
      ids,
      true,
      false,
    ).pipe(
      map((result) => this.syncValue(type, s, localStorageKey, result, id, options)),
      catchError((error) => {
        if (error instanceof HttpErrorResponse && error.status === 404) {
          this.syncValue(type, s, localStorageKey, undefined, id, options);
          return of(undefined);
        }
        return throwError(() => error);
      }),
    );
  }

  private fetch<S>(
    type: SyncType,
    s: WritableSignal<unknown>,
    localStorageKey?: LocalStorage,
    schema?: ZodSchema,
    url?: string,
    idFormatter?: (...args: unknown[]) => string,
    parseItem?: (data: S) => S,
    ids: unknown[] = [],
    persist = false,
    publishWrite = true,
  ): Observable<S | undefined> {
    if (!url) throw Error('Url is empty (fetch)');
    if (ids.includes(null)) throw Error('Argument is null (fetch)');

    // Concurrent callers for the same endpoint (page queries, the optimistic executor and the
    // sync helpers) share one HTTP request instead of each firing their own duplicate fetch.
    const requestUrl = toUrl(url, ids);
    const inFlight = this.inFlightFetches.get(requestUrl);
    const shared$ = (inFlight ??
      this.http.get<S>(requestUrl).pipe(
        map((res) => {
          const value = type === 'objects' && Array.isArray(res) ? (res as S[])[0] : res;
          return parseItem ? parseItem(value) : value;
        }),
        parseResponse(schema),
        rateLimit(),
        finalize(() => {
          this.inFlightFetches.delete(requestUrl);
        }),
        shareReplay({ bufferSize: 1, refCount: true }),
      )) as Observable<S>;
    if (!inFlight) this.inFlightFetches.set(requestUrl, shared$);

    const writeNotFound = (id: string): void => {
      this.syncValue(type, s, localStorageKey, undefined, id, {
        deferPublish: !publishWrite,
      });
    };

    // Persist with this caller's own `persist` flag, not the caller that opened the shared
    // request: a persist=false opener (e.g. the show page's next-episode query merging the
    // translation without storing it) must not swallow a later persist=true caller's write,
    // otherwise the store stays empty and a follow-up sync re-fetches the same URL.
    if (!persist) {
      return shared$.pipe(
        catchError((error) => {
          if (error instanceof HttpErrorResponse && error.status === 404) return of(undefined);
          return throwError(() => error);
        }),
      );
    }
    return shared$.pipe(
      map((valueMapped) => {
        const id = idFormatter ? idFormatter(...ids) : (ids[0] as string);
        this.syncValue(type, s, localStorageKey, valueMapped, id, {
          deferPublish: !publishWrite,
        });
        return valueMapped;
      }),
      catchError((error) => {
        if (error instanceof HttpErrorResponse && error.status === 404) {
          const id = idFormatter ? idFormatter(...ids) : (ids[0] as string);
          writeNotFound(id);
          return of(undefined);
        }
        return throwError(() => error);
      }),
    );
  }

  private evictRecord(
    s: WritableSignal<Record<string, unknown>>,
    localStorageKey?: LocalStorage,
    predicate: (key: string) => boolean = () => false,
  ): void {
    const values = s();
    const next = Object.fromEntries(Object.entries(values).filter(([key]) => !predicate(key)));
    if (Object.keys(next).length === Object.keys(values).length) return;
    s.set(next);
    if (localStorageKey) {
      this.localStorageService.setObject(localStorageKey, next);
    }
  }

  private flush(type: SyncType, s: WritableSignal<unknown>, localStorageKey?: LocalStorage): void {
    switch (type) {
      case 'object':
        s.set({ ...((s() ?? {}) as object) });
        break;
      case 'array':
        s.set([...((s() ?? []) as unknown[])]);
        break;
      case 'objects':
        s.set({ ...(s() as Record<string, unknown>) });
        break;
      case 'arrays':
        s.set({ ...(s() as Record<string, unknown>) });
        break;
      default:
        throw Error('Type not known (flush)');
    }
    if (localStorageKey) {
      this.localStorageService.setObject<unknown>(localStorageKey, s());
    }
  }

  private syncValue<S>(
    type: SyncType,
    s: WritableSignal<unknown>,
    localStorageKey: LocalStorage | undefined,
    result: unknown,
    id: string,
    options: SyncOptions = {},
  ): void {
    switch (type) {
      case 'object':
      case 'array':
        break;
      case 'objects':
        (s() as Record<string, S>)[id] = (result as S) ?? ({} as S);
        break;
      case 'arrays':
        (s() as Record<string, S[]>)[id] = (result as S[]) ?? [];
        break;
      default:
        throw Error('Type not known (syncValue)');
    }
    const deferred = options.deferPublish === true;
    if (!deferred) {
      console.debug('publish', localStorageKey);
      switch (type) {
        case 'object':
          s.set({ ...(result as object) });
          break;
        case 'array':
          s.set([...((result ?? []) as unknown[])]);
          break;
        case 'objects':
          s.set({ ...(s() as Record<string, unknown>) });
          break;
        case 'arrays':
          s.set({ ...(s() as Record<string, unknown>) });
          break;
        default:
          throw Error('Type not known (syncValue)');
      }
    }
    if (localStorageKey) {
      this.localStorageService.setObject<unknown>(localStorageKey, s());
    }
  }

  private addMissingValues<T extends Record<string, unknown>>(
    signal: WritableSignal<T | undefined>,
    defaultValues: T,
  ): void {
    let value: Record<string, unknown> | undefined = signal();
    if (!value) return;

    value = mergeDeepCustom(defaultValues, value);

    signal.set({ ...value } as T);
    this.localStorageService.setObject(LocalStorage.CONFIG, value);
  }
}

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
import { lastValueFrom, map, Observable } from 'rxjs';
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
  private readonly inFlightFetches = new Map<string, Promise<unknown>>();

  /**
   * Staged whole-store values for `array`/`object` writes that must not notify yet.
   * `objects`/`arrays` stores mutate their record in place instead, so they need no entry here.
   */
  private readonly pendingValues = new Map<object, unknown>();

  /**
   * Nested publish batch (see `beginBatch`): while > 0, `flush()` only records and
   * `syncValue()` only stages, so a multi-step sync publishes each store once at `endBatch()`
   * instead of jumping the list UI once per step.
   */
  private batchDepth = 0;

  /** Deferred flush callbacks collected while batching, deduplicated per signal. */
  private readonly batchedFlushes = new Map<object, () => void>();

  /**
   * Signals with un-published staged writes. A mid-sync `flush()` registers only these, so
   * flushing untouched stores (or helper flushes with nothing new) never triggers a UI update.
   */
  private readonly stagedSignals = new Set<object>();

  /** Opens a publish batch: signal writes stage without notifying until `endBatch()`. */
  beginBatch(): void {
    this.batchDepth++;
  }

  /** Whether signal writes currently stage without notifying. */
  isBatching(): boolean {
    return this.batchDepth > 0;
  }

  /**
   * Whether a write with these options must stage instead of publishing: explicitly
   * deferred, or inside a sync-wide batch. Centralizes the check repeated by every
   * staging site (array/object/paged/bulk/evict paths and the sync helpers).
   */
  shouldDefer(options?: SyncOptions): boolean {
    return options?.deferPublish === true || this.isBatching();
  }

  /** Marks a signal as holding staged writes so a mid-sync `flush()` picks it up. */
  markStaged(s: object): void {
    this.stagedSignals.add(s);
  }

  /** Closes a publish batch, publishing each staged store exactly once. */
  endBatch(): void {
    if (this.batchDepth === 0) return;
    this.batchDepth--;
    if (this.batchDepth > 0) return;
    const flushes = [...this.batchedFlushes.values()];
    this.batchedFlushes.clear();
    this.stagedSignals.clear();
    for (const flush of flushes) flush();
  }

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
      syncIds: (ids: SyncIds, options?: SyncOptions): Promise<void> =>
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
      fetchIds: (ids: SyncIds, options?: FetchPersistOptions): Promise<T | undefined> =>
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
      syncIds: (ids: SyncIds, options?: SyncOptions): Promise<void> =>
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
      fetchIds: (ids: SyncIds, options?: FetchPersistOptions): Promise<T[] | undefined> =>
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
        ),
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
      sync: (options?: SyncOptions): Promise<void> => {
        return lastValueFrom(this.fetchPages<TItem>(url, pageSize, schema)).then((items) => {
          const record: Record<string, T> = {};
          items.forEach((item) => {
            const value = parseItem ? parseItem(item) : (item as unknown as T);
            record[idFormatter(item)] = value;
          });
          if (localStorageKey) {
            this.localStorageService.setObject(localStorageKey, record);
          }
          const deferred = this.shouldDefer(options);
          if (deferred) {
            this.pendingValues.set(s as WritableSignal<unknown>, record);
            this.markStaged(s as WritableSignal<unknown>);
            this.flush('objects', s as WritableSignal<unknown>, localStorageKey);
          } else {
            s.set(record);
          }
        });
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
      sync: (options?: SyncOptions): Promise<void> => {
        return lastValueFrom(this.fetchPages<T>(url, pageSize, schema)).then((items) => {
          if (localStorageKey) {
            this.localStorageService.setObject(localStorageKey, items);
          }
          const deferred = this.shouldDefer(options);
          if (deferred) {
            this.pendingValues.set(s as WritableSignal<unknown>, items);
            this.markStaged(s as WritableSignal<unknown>);
            this.flush('array', s as WritableSignal<unknown>, localStorageKey);
          } else {
            s.set(items);
          }
        });
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
  ): Promise<void> {
    const id = idFormatter ? idFormatter(...ids) : (ids[0] as string);

    if (!url) {
      const result = s();
      this.syncValue(type, s, localStorageKey, result, id, options);
      return Promise.resolve();
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

    if (!options?.force && !ignoreExisting && isExisting) return Promise.resolve();

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
    ).then(
      (result) => {
        this.syncValue(type, s, localStorageKey, result, id, options);
      },
      (error: unknown) => {
        if (this.isNotFound(error)) {
          this.syncValue(type, s, localStorageKey, undefined, id, options);
          return;
        }
        throw error;
      },
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
  ): Promise<S | undefined> {
    if (!url) throw Error('Url is empty (fetch)');
    if (ids.includes(null)) throw Error('Argument is null (fetch)');

    // Concurrent callers for the same endpoint (page queries, the optimistic executor and the
    // sync helpers) share one HTTP request instead of each firing their own duplicate fetch.
    // The entry is dropped once the request settles; afterwards callers re-fetch.
    const requestUrl = toUrl(url, ids);
    const inFlight = this.inFlightFetches.get(requestUrl);
    let shared: Promise<S>;
    if (inFlight) {
      shared = inFlight as Promise<S>;
    } else {
      shared = lastValueFrom(
        this.http.get<S>(requestUrl).pipe(
          map((res) => {
            const value = type === 'objects' && Array.isArray(res) ? (res as S[])[0] : res;
            return parseItem ? parseItem(value) : value;
          }),
          parseResponse(schema),
          rateLimit(),
        ),
      );
      this.inFlightFetches.set(requestUrl, shared);
      const cleanup = (): void => {
        if (this.inFlightFetches.get(requestUrl) === shared) {
          this.inFlightFetches.delete(requestUrl);
        }
      };
      shared.then(cleanup, cleanup);
    }

    const id = idFormatter ? idFormatter(...ids) : (ids[0] as string);

    // Persist with this caller's own `persist` flag, not the caller that opened the shared
    // request: a persist=false opener (e.g. the show page's next-episode query merging the
    // translation without storing it) must not swallow a later persist=true caller's write,
    // otherwise the store stays empty and a follow-up sync re-fetches the same URL.
    if (!persist) {
      return shared.catch((error: unknown) => {
        if (this.isNotFound(error)) return undefined;
        throw error;
      });
    }
    return shared.then(
      (valueMapped) => {
        this.syncValue(type, s, localStorageKey, valueMapped, id, {
          deferPublish: !publishWrite,
        });
        return valueMapped;
      },
      (error: unknown) => {
        if (this.isNotFound(error)) {
          this.syncValue(type, s, localStorageKey, undefined, id, {
            deferPublish: !publishWrite,
          });
          return undefined;
        }
        throw error;
      },
    );
  }

  private isNotFound(error: unknown): boolean {
    return error instanceof HttpErrorResponse && error.status === 404;
  }

  private evictRecord(
    s: WritableSignal<Record<string, unknown>>,
    localStorageKey?: LocalStorage,
    predicate: (key: string) => boolean = () => false,
  ): void {
    const values = s();
    const removedKeys = Object.keys(values).filter((key) => predicate(key));
    if (removedKeys.length === 0) return;
    if (this.isBatching()) {
      for (const key of removedKeys) delete values[key];
      if (localStorageKey) {
        this.localStorageService.setObject(localStorageKey, values);
      }
      this.markStaged(s as WritableSignal<unknown>);
      this.flush('objects', s as WritableSignal<unknown>, localStorageKey);
      return;
    }
    const next = Object.fromEntries(Object.entries(values).filter(([key]) => !predicate(key)));
    if (Object.keys(next).length === Object.keys(values).length) return;
    s.set(next);
    if (localStorageKey) {
      this.localStorageService.setObject(localStorageKey, next);
    }
  }

  private flush(type: SyncType, s: WritableSignal<unknown>, localStorageKey?: LocalStorage): void {
    if (this.isBatching()) {
      // Register only stores that actually staged writes: flushing untouched stores (or a
      // helper flush with nothing new) must not wake the list UI mid-sync.
      if (this.stagedSignals.has(s) && !this.batchedFlushes.has(s)) {
        this.batchedFlushes.set(s, () => this.flush(type, s, localStorageKey));
      }
      return;
    }
    const pending = this.pendingValues.get(s);
    if (pending !== undefined) {
      this.pendingValues.delete(s);
      if (type === 'array') {
        s.set([...((pending ?? []) as unknown[])]);
      } else {
        s.set({ ...((pending ?? {}) as Record<string, unknown>) });
      }
    } else {
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
    }
    this.stagedSignals.delete(s);
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
    // While batching, every write only stages: the list UI stays put until endBatch()
    // publishes each store once, instead of jumping once per sync step.
    const deferred = this.shouldDefer(options);
    if (!deferred) {
      this.pendingValues.delete(s);
      this.stagedSignals.delete(s);
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
    } else if (type === 'array' || type === 'object') {
      // Whole-store writes have no record to mutate in place, so the fetched value is
      // staged and applied by flush(); without this the deferred result would be lost and
      // the later flush would re-publish the stale value.
      this.pendingValues.set(s, result ?? (type === 'array' ? [] : {}));
      this.markStaged(s);
    } else {
      this.markStaged(s);
    }
    if (localStorageKey) {
      const persistValue =
        deferred && (type === 'array' || type === 'object') && result !== undefined ? result : s();
      this.localStorageService.setObject<unknown>(localStorageKey, persistValue);
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

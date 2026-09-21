import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import {
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
  SyncOptions,
  SyncType,
} from '@type/Sync';
import { catchError, map, Observable, of, throwError } from 'rxjs';
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
          options,
        ),
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
          options,
        ),
    };
  }

  syncObjectWithDefault<T extends Record<string, unknown>>(
    params: ParamsObjectWithDefault<T>,
  ): ReturnValueObjectWithDefault<T> {
    const { s, sync } = this.syncObject<T>({ ...params });

    if (!s()) {
      s.set({ ...params.default });
    }

    this.addMissingValues<T>(s, params.default);

    return { s: s as WritableSignal<T>, sync };
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

    return {
      s,
      sync: (...args): Observable<void> =>
        this.sync(
          'objects',
          s as WritableSignal<unknown>,
          localStorageKey,
          schema,
          url,
          idFormatter,
          ignoreExisting,
          parseItem,
          ...args,
        ),
      fetch: (...args) =>
        this.fetch(
          'objects',
          s as WritableSignal<unknown>,
          localStorageKey,
          schema,
          url,
          idFormatter,
          parseItem,
          ...args,
        ),
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

    return {
      s,
      sync: (...args): Observable<void> =>
        this.sync(
          'arrays',
          s as WritableSignal<unknown>,
          localStorageKey,
          schema,
          url,
          idFormatter,
          ignoreExisting,
          parseItem,
          ...args,
        ),
      fetch: (...args) =>
        this.fetch(
          'arrays',
          s as WritableSignal<unknown>,
          localStorageKey,
          schema,
          url,
          idFormatter,
          parseItem,
          ...args,
        ),
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
    ...args: unknown[]
  ): Observable<void> {
    const options = isObject(args[args.length - 1])
      ? (args[args.length - 1] as SyncOptions)
      : undefined;
    if (options || args[args.length - 1] === undefined) args.splice(args.length - 1, 1);

    const id = idFormatter ? idFormatter(...(args as number[])) : (args[0] as string);

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

    if (options?.deleteOld && type === 'objects') {
      const values = s() as Record<string, S>;
      const oldValues = Object.entries(values).filter(
        ([valueId]) => valueId !== id && valueId.startsWith(`${id.split('-')[0]}-`),
      );

      oldValues.forEach(([valueId, value]) => {
        console.debug('removing value:', valueId, value);
        delete values[valueId];
      });

      if (oldValues.length) {
        s.set({ ...values });
        if (localStorageKey) {
          this.localStorageService.setObject<unknown>(localStorageKey, s());
        }
      }
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
      ...args,
    ).pipe(
      map((result) => this.syncValue(type, s, localStorageKey, result, id, options)),
      catchError((error) => {
        const isHttpError = error instanceof HttpErrorResponse && error.status !== 404;
        if (!isHttpError) {
          const id = idFormatter ? idFormatter(...(args as number[])) : (args[0] as string);
          this.syncValue(type, s, localStorageKey, undefined, id, { publishSingle: false });
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
    ...args: unknown[]
  ): Observable<S> {
    if (!url) throw Error('Url is empty (fetch)');
    if (args.includes(null)) throw Error('Argument is null (fetch)');

    const sync = args[args.length - 1] === true;
    if (sync) args.splice(args.length - 1, 1);

    return this.http.get<S>(toUrl(url, args)).pipe(
      map((res) => {
        const value = type === 'objects' && Array.isArray(res) ? (res as S[])[0] : res;
        const valueMapped = parseItem ? parseItem(value) : value;
        if (sync) {
          const id = idFormatter ? idFormatter(...(args as number[])) : (args[0] as string);
          this.syncValue(type, s, localStorageKey, valueMapped, id, { publishSingle: false });
        }
        return valueMapped;
      }),
      parseResponse(schema),
      catchError((error) => {
        const isHttpError = error instanceof HttpErrorResponse && error.status !== 404;
        if (sync && !isHttpError) {
          const id = idFormatter ? idFormatter(...(args as number[])) : (args[0] as string);
          this.syncValue(type, s, localStorageKey, undefined, id, { publishSingle: false });
        }
        return throwError(() => error);
      }),
      rateLimit(),
    );
  }

  private syncValue<S>(
    type: SyncType,
    s: WritableSignal<unknown>,
    localStorageKey: LocalStorage | undefined,
    result: unknown,
    id: string,
    options: SyncOptions = { publishSingle: true },
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
    if (options.publishSingle) {
      console.debug('publish', localStorageKey);
      switch (type) {
        case 'object':
          s.set({ ...(result as object) });
          break;
        case 'array':
          s.set([...((result ?? []) as unknown[])]);
          break;
        case 'objects':
          s.set({ ...(s() as unknown[]) });
          break;
        case 'arrays':
          s.set([...((s() ?? []) as unknown[])]);
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

import { inject, Injectable, signal, type WritableSignal } from '@angular/core';
import type {
  Params,
  ParamsObject,
  ParamsObjectWithDefault,
  ReturnValueArray,
  ReturnValueObject,
  ReturnValueObjects,
  ReturnValueObjectWithDefault,
  ReturnValuesArrays,
  SyncOptions,
  SyncType,
} from '@type/Sync';
import { catchError, map, type Observable, of, retry, throwError } from 'rxjs';
import { LocalStorage } from '@type/Enum';
import { LocalStorageService } from '@services/local-storage.service';
import type { ZodSchema } from 'zod';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { urlReplace } from '@helper/urlReplace';
import { parseResponse } from '@operator/parseResponse';
import { errorDelay } from '@helper/errorDelay';
import { isObject } from '@helper/isObject';
import { mergeDeepCustom } from '@helper/deepMerge';

@Injectable({
  providedIn: 'root',
})
export class SyncDataService {
  localStorageService = inject(LocalStorageService);
  http = inject(HttpClient);

  syncArray<T>({ localStorageKey, schema, url }: Params): ReturnValueArray<T> {
    const localStorageValue = this.localStorageService.getObject<T[]>(localStorageKey);
    const s = signal<T[]>(Array.isArray(localStorageValue) ? localStorageValue : []);
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
    const s = signal<T | undefined>(this.localStorageService.getObject<T>(localStorageKey));
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
    mapFunction,
  }: ParamsObject<T>): ReturnValueObjects<T> {
    const s = signal<Record<string, T | undefined>>(
      this.localStorageService.getObject<Record<number, T>>(localStorageKey) ?? {},
    );
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
          mapFunction,
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
          mapFunction,
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
    mapFunction,
  }: ParamsObject<T[]>): ReturnValuesArrays<T> {
    const s = signal<Record<string, T[] | undefined>>(
      this.localStorageService.getObject<Record<string, T[]>>(localStorageKey) ?? {},
    );
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
          mapFunction,
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
          mapFunction,
          ...args,
        ),
    };
  }

  private sync<S>(
    type: SyncType,
    s: WritableSignal<unknown>,
    localStorageKey: LocalStorage,
    schema?: ZodSchema,
    url?: string,
    idFormatter?: (...args: unknown[]) => string,
    ignoreExisting?: boolean,
    mapFunction?: (data: S) => S,
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
        this.localStorageService.setObject<unknown>(localStorageKey, s());
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
      mapFunction,
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
    localStorageKey: LocalStorage,
    schema?: ZodSchema,
    url?: string,
    idFormatter?: (...args: unknown[]) => string,
    mapFunction?: (data: S) => S,
    ...args: unknown[]
  ): Observable<S> {
    if (!url) throw Error('Url is empty (fetch)');
    if (args.includes(null)) throw Error('Argument is null (fetch)');

    const sync = args[args.length - 1] === true;
    if (sync) args.splice(args.length - 1, 1);

    return this.http
      .get<S>(
        urlReplace(url, args),
        //   {
        //   headers: {
        //     // todo fix api caching issue, "Cache-Control: no-cache" is set by DevTools when "no cache" is selected but the header is not allowed by CORS when setting it manually
        //     // 'Cache-Control': 'no-cache',
        //   },
        // }
      )
      .pipe(
        map((res) => {
          const value = type === 'objects' && Array.isArray(res) ? (res as S[])[0] : res;
          const valueMapped = mapFunction ? mapFunction(value) : value;
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
        retry({
          count: 1,
          delay: errorDelay,
        }),
      );
  }

  private syncValue<S>(
    type: SyncType,
    s: WritableSignal<unknown>,
    localStorageKey: LocalStorage,
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
    this.localStorageService.setObject<unknown>(localStorageKey, s());
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

import { Injectable } from '@angular/core';
import {
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
import { BehaviorSubject, catchError, map, Observable, of, retry, throwError } from 'rxjs';
import { LocalStorage } from '@type/Enum';
import { LocalStorageService } from '@services/local-storage.service';
import { ZodSchema } from 'zod';
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
  constructor(
    private localStorageService: LocalStorageService,
    private http: HttpClient,
  ) {}

  syncArray<T>({ localStorageKey, schema, url }: Params): ReturnValueArray<T> {
    const localStorageValue = this.localStorageService.getObject<T[]>(localStorageKey);
    const $ = new BehaviorSubject<T[] | undefined>(
      Array.isArray(localStorageValue) ? localStorageValue : undefined,
    );
    return {
      $,
      sync: (options) =>
        this.sync(
          'array',
          $ as BehaviorSubject<unknown>,
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
    const $ = new BehaviorSubject<T | undefined>(
      this.localStorageService.getObject<T>(localStorageKey),
    );
    return {
      $,
      sync: (options) =>
        this.sync(
          'object',
          $ as BehaviorSubject<unknown>,
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
    const { $, sync } = this.syncObject<T>({ ...params });

    if (!$.value) {
      $.next(params.default);
    }

    this.addMissingValues<T>($, params.default);

    return { $: $ as BehaviorSubject<T>, sync };
  }

  syncObjects<T>({
    localStorageKey,
    schema,
    idFormatter,
    url,
    ignoreExisting,
    mapFunction,
  }: ParamsObject<T>): ReturnValueObjects<T> {
    const $ = new BehaviorSubject<{ [id: string]: T | undefined }>(
      this.localStorageService.getObject<{ [id: number]: T }>(localStorageKey) ?? {},
    );
    return {
      $,
      sync: (...args): Observable<void> =>
        this.sync(
          'objects',
          $ as BehaviorSubject<unknown>,
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
          $ as BehaviorSubject<unknown>,
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
    const $ = new BehaviorSubject<{ [id: string]: T[] | undefined }>(
      this.localStorageService.getObject<{ [id: string]: T[] }>(localStorageKey) ?? {},
    );
    return {
      $,
      sync: (...args): Observable<void> =>
        this.sync(
          'arrays',
          $ as BehaviorSubject<unknown>,
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
          $ as BehaviorSubject<unknown>,
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
    $: BehaviorSubject<unknown>,
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
      const result = $.value;
      this.syncValue(type, $, localStorageKey, result, id, options);
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
        ([valueId]) => valueId !== id && valueId.startsWith(`${id.split('-')[0]}-`),
      );

      oldValues.forEach(([valueId, value]) => {
        console.debug('removing value:', valueId, value);
        delete values[valueId];
      });

      if (oldValues.length) {
        $.next(values);
        this.localStorageService.setObject<unknown>(localStorageKey, $.value);
      }
    }

    if (!options?.force && !ignoreExisting && isExisting) return of(undefined);

    return this.fetch<S>(
      type,
      $ as BehaviorSubject<unknown>,
      localStorageKey,
      schema,
      url,
      idFormatter,
      mapFunction,
      ...args,
    ).pipe(
      map((result) => this.syncValue(type, $, localStorageKey, result, id, options)),
      catchError((error) => {
        const isHttpError = error instanceof HttpErrorResponse && error.status !== 404;
        if (!isHttpError) {
          const id = idFormatter ? idFormatter(...(args as number[])) : (args[0] as string);
          this.syncValue(type, $, localStorageKey, undefined, id, { publishSingle: false });
        }
        return throwError(() => error);
      }),
    );
  }

  private fetch<S>(
    type: SyncType,
    $: BehaviorSubject<unknown>,
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
            this.syncValue(type, $, localStorageKey, valueMapped, id, { publishSingle: false });
          }
          return valueMapped;
        }),
        parseResponse(schema),
        catchError((error) => {
          const isHttpError = error instanceof HttpErrorResponse && error.status !== 404;
          if (sync && !isHttpError) {
            const id = idFormatter ? idFormatter(...(args as number[])) : (args[0] as string);
            this.syncValue(type, $, localStorageKey, undefined, id, { publishSingle: false });
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
    $: BehaviorSubject<unknown>,
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
    this.localStorageService.setObject<unknown>(localStorageKey, $.value);
  }

  private addMissingValues<T extends Record<string, unknown>>(
    subject$: BehaviorSubject<T | undefined>,
    defaultValues: T,
  ): void {
    let value: Record<string, unknown> | undefined = subject$?.value;
    if (!value) return;

    value = mergeDeepCustom(defaultValues, value);

    subject$.next(value as T);
    this.localStorageService.setObject(LocalStorage.CONFIG, value);
  }
}

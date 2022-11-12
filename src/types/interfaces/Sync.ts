import { BehaviorSubject, Observable } from 'rxjs';
import { LocalStorage } from '../enum';
import { ZodSchema } from 'zod';

export interface Params {
  localStorageKey: LocalStorage;
  schema?: ZodSchema;
  url?: string;
  baseUrl?: string;
}

export interface ParamsObject<T> extends Params {
  idFormatter?: (...args: unknown[]) => string;
  ignoreExisting?: boolean;
  mapFunction?: (data: T) => T;
}

export interface ParamsObjectWithDefault<T> extends ParamsObject<T> {
  default: T;
}

export type ReturnValueArray<T> = {
  $: BehaviorSubject<T[] | undefined>;
  sync: (options?: SyncOptions) => Observable<void>;
};
export type ReturnValueObject<T> = {
  $: BehaviorSubject<T | undefined>;
  sync: (options?: SyncOptions) => Observable<void>;
};
export type ReturnValueObjectWithDefault<T> = {
  $: BehaviorSubject<T>;
  sync: (options?: SyncOptions) => Observable<void>;
};
export type ReturnValueObjects<T> = {
  $: BehaviorSubject<{ [id: string]: T | undefined }>;
  sync: (...args: unknown[]) => Observable<void>;
  fetch: (...args: unknown[]) => Observable<T>;
};
export type ReturnValuesArrays<T> = {
  $: BehaviorSubject<{ [id: string]: T[] | undefined }>;
  sync: (...args: unknown[]) => Observable<void>;
  fetch: (...args: unknown[]) => Observable<T[]>;
};

export interface SyncOptions {
  publishSingle?: boolean;
  deleteOld?: boolean;
  showSyncingSnackbar?: boolean;
  force?: boolean;
  showConfirm?: boolean;
}

export type SyncType = 'array' | 'arrays' | 'object' | 'objects';

export interface FetchOptions {
  sync?: boolean;
  fetch?: boolean;
  fetchAlways?: boolean;
}

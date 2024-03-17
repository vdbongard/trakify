import { Observable } from 'rxjs';
import { LocalStorage } from './Enum';
import { ZodSchema } from 'zod';
import { WritableSignal } from '@angular/core';

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

export interface ReturnValueArray<T> {
  s: WritableSignal<T[]>;
  sync: (options?: SyncOptions) => Observable<void>;
}
export interface ReturnValueObject<T> {
  s: WritableSignal<T | undefined>;
  sync: (options?: SyncOptions) => Observable<void>;
}
export interface ReturnValueObjectWithDefault<T> {
  s: WritableSignal<T>;
  sync: (options?: SyncOptions) => Observable<void>;
}
export interface ReturnValueObjects<T> {
  s: WritableSignal<Record<string, T | undefined>>;
  sync: (...args: unknown[]) => Observable<void>;
  fetch: (...args: unknown[]) => Observable<T>;
}
export interface ReturnValuesArrays<T> {
  s: WritableSignal<Record<string, T[] | undefined>>;
  sync: (...args: unknown[]) => Observable<void>;
  fetch: (...args: unknown[]) => Observable<T[]>;
}

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

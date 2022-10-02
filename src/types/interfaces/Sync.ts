import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { LocalStorage } from '../enum';
import { ZodSchema } from 'zod';

export interface Params {
  localStorageKey: LocalStorage;
  schema?: ZodSchema;
  http?: HttpClient;
  url?: string;
}

export interface ParamsFull extends Params {
  baseUrl?: string;
}

export interface ParamsFullObject extends ParamsFull {
  idFormatter?: (...args: unknown[]) => string;
  ignoreExisting?: boolean;
}

export interface ParamsFullObjectWithDefault<T> extends ParamsFullObject {
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
}

export type SyncType = 'array' | 'arrays' | 'object' | 'objects';

export interface FetchOptions {
  sync?: boolean;
  fetch?: boolean;
  fetchAlways?: boolean;
}

import { LocalStorage } from './Enum';
import { ZodSchema } from 'zod';
import { WritableSignal } from '@angular/core';

export interface Params {
  localStorageKey?: LocalStorage;
  schema?: ZodSchema;
  url?: string;
  baseUrl?: string;
}

export interface ParamsObject<T> extends Params {
  idFormatter?: (...args: unknown[]) => string;
  ignoreExisting?: boolean;
  parseItem?: (data: T) => T;
}

export interface ParamsObjectWithDefault<T> extends ParamsObject<T> {
  default: T;
}

export interface ParamsArrayPaged extends Params {
  pageSize: number;
}

export interface ParamsMap<T, TItem = T> extends Params {
  idFormatter: (item: TItem) => string;
  parseItem?: (item: TItem) => T;
  pageSize: number;
}

export type SyncIds = readonly (string | number)[];

export interface FetchPersistOptions {
  persist?: boolean;
}

export interface ReturnValueArray<T> {
  s: WritableSignal<T[]>;
  sync: (options?: SyncOptions) => Promise<void>;
  flush: () => void;
}
export interface ReturnValueObject<T> {
  s: WritableSignal<T | undefined>;
  sync: (options?: SyncOptions) => Promise<void>;
  flush: () => void;
}
export interface ReturnValueObjectWithDefault<T> {
  s: WritableSignal<T>;
  sync: (options?: SyncOptions) => Promise<void>;
  flush: () => void;
}
export interface ReturnValueObjects<T> {
  s: WritableSignal<Record<string, T | undefined>>;
  syncIds: (ids: SyncIds, options?: SyncOptions) => Promise<void>;
  fetchIds: (ids: SyncIds, options?: FetchPersistOptions) => Promise<T | undefined>;
  evictWhere: (predicate: (key: string) => boolean) => void;
  flush: () => void;
}
export interface ReturnValueMap<T> {
  s: WritableSignal<Record<string, T | undefined>>;
  sync: (options?: SyncOptions) => Promise<void>;
  flush: () => void;
}
export interface ReturnValuesArrays<T> {
  s: WritableSignal<Record<string, T[] | undefined>>;
  syncIds: (ids: SyncIds, options?: SyncOptions) => Promise<void>;
  fetchIds: (ids: SyncIds, options?: FetchPersistOptions) => Promise<T[] | undefined>;
  evictWhere: (predicate: (key: string) => boolean) => void;
  flush: () => void;
}

export interface SyncOptions {
  /** When true, writes without notifying; caller must call flush() once. */
  deferPublish?: boolean;
  showSyncingSnackbar?: boolean;
  force?: boolean;
  showConfirm?: boolean;
}

export type SyncType = 'array' | 'arrays' | 'object' | 'objects';

import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface Params {
  localStorageKey: string;
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

export type ReturnValueArray<T> = [
  BehaviorSubject<T[]>,
  (options?: SyncOptions) => Observable<void>
];

export type ReturnValueObject<T> = [
  BehaviorSubject<T | undefined>,
  (options?: SyncOptions) => Observable<void>
];
export type ReturnValueObjectWithDefault<T> = [
  BehaviorSubject<T>,
  (options?: SyncOptions) => Observable<void>
];

export type ReturnValueObjects<T> = [
  BehaviorSubject<{ [id: number]: T }>,
  (...args: unknown[]) => Observable<void>,
  (...args: unknown[]) => Observable<T>
];

export type ReturnValuesArrays<T> = [
  BehaviorSubject<{ [id: number]: T[] }>,
  (...args: unknown[]) => Observable<void>,
  (...args: unknown[]) => Observable<T[]>
];

export interface SyncOptions {
  force?: boolean;
  publishSingle?: boolean;
}

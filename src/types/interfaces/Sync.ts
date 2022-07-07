import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { HttpOptions } from './Http';

export interface Params {
  localStorageKey: string;
  providers: [HttpClient];
  url?: string;
}

export interface ParamsFull extends Params {
  baseUrl?: string;
  httpOptions?: HttpOptions;
}

export interface ParamsFullObject extends ParamsFull {
  idFormatter?: (...args: unknown[]) => string;
}

export type ReturnValueArray<T> = [BehaviorSubject<T[]>, () => Promise<void>];

export type ReturnValueObject<T> = [
  BehaviorSubject<{ [id: number]: T }>,
  (...args: unknown[]) => Promise<void>,
  (...args: unknown[]) => Observable<T>
];

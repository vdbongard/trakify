import { SimpleChange, SimpleChanges } from '@angular/core';

export type SimpleChangeTyped<T> = Omit<SimpleChange, SimpleChange['previousValue']> & {
  previousValue: T;
  currentValue: T;
  firstChange: boolean;
  isFirstChange(): boolean;
};

export type SimpleChangesTyped<T> = {
  [K in keyof T]: SimpleChangeTyped<T[K]>;
} & SimpleChanges;

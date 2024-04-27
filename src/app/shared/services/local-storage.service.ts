import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { onError } from '@helper/error';
import { isObject } from '@helper/isObject';

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  snackBar = inject(MatSnackBar);

  getObject<T>(name: string): T | undefined {
    const item = localStorage.getItem(name);
    if (!item) return;
    const parsedItem = JSON.parse(item);
    if (isObject(parsedItem)) {
      return this.replaceEmptyObjectWithUndefined(parsedItem);
    }
    return parsedItem as T | undefined;
  }

  setObject<T>(name: string, objectLike: T | undefined): void {
    if (!objectLike) return;
    if (isObject(objectLike)) {
      const object = this.replaceUndefinedWithEmptyObject(objectLike);
      try {
        localStorage.setItem(name, JSON.stringify(object));
      } catch (error) {
        onError(error, this.snackBar);
      }
      return;
    }
    localStorage.setItem(name, JSON.stringify(objectLike));
  }

  private replaceEmptyObjectWithUndefined<T>(item: object): T {
    return Object.fromEntries(
      Object.entries(item).map(([id, value]) => {
        value = isObject(value) && Object.values(value as object).length === 0 ? undefined : value;
        return [id, value];
      }),
    ) as T;
  }

  private replaceUndefinedWithEmptyObject<T>(item: object): T {
    return Object.fromEntries(
      Object.entries(item).map(([id, value]) => {
        value = value === undefined ? {} : value;
        return [id, value];
      }),
    ) as T;
  }
}

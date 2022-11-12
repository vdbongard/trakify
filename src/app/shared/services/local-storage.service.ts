import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { isObject } from '@helper/isObject';
import { onError } from '@helper/error';

@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  constructor(private snackBar: MatSnackBar) {}

  getObject<T>(name: string): T | undefined {
    const item = localStorage.getItem(name);
    if (!item) return;
    const parsedItem = JSON.parse(item);
    if (!isObject(parsedItem)) return;
    return this.replaceEmptyObjectWithUndefined(parsedItem);
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
      })
    ) as T;
  }

  private replaceUndefinedWithEmptyObject<T>(item: object): T {
    return Object.fromEntries(
      Object.entries(item).map(([id, value]) => {
        value = value === undefined ? {} : value;
        return [id, value];
      })
    ) as T;
  }
}

import { isObject } from './isObject';
import { onError } from '@helper/error';
import { MatSnackBar } from '@angular/material/snack-bar';

export function getLocalStorage<T>(name: string): T | undefined {
  const item = localStorage.getItem(name);
  if (!item) return;
  const parsedItem = JSON.parse(item);
  if (isObject(parsedItem)) {
    return replaceEmptyObjectWithUndefined(parsedItem);
  }
  return parsedItem as T | undefined;
}

export function setLocalStorage<T>(
  name: string,
  objectLike: T | undefined,
  snackBar: MatSnackBar
): void {
  if (!objectLike) return;
  if (isObject(objectLike)) {
    const object = replaceUndefinedWithEmptyObject(objectLike);
    try {
      localStorage.setItem(name, JSON.stringify(object));
    } catch (error) {
      onError(error, snackBar);
    }
    return;
  }
  localStorage.setItem(name, JSON.stringify(objectLike));
}

function replaceEmptyObjectWithUndefined<T>(item: object): T {
  return Object.fromEntries(
    Object.entries(item).map(([id, value]) => {
      value = isObject(value) && Object.values(value as object).length === 0 ? undefined : value;
      return [id, value];
    })
  ) as T;
}

function replaceUndefinedWithEmptyObject<T>(item: object): T {
  return Object.fromEntries(
    Object.entries(item).map(([id, value]) => {
      value = value === undefined ? {} : value;
      return [id, value];
    })
  ) as T;
}

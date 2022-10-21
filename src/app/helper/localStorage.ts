import { isObject } from '@helper/isObject';

export function getLocalStorage<T>(name: string): T | undefined {
  const item = localStorage.getItem(name);
  if (!item) return;
  const parsedItem = JSON.parse(item);
  if (isObject(parsedItem)) {
    return replaceEmptyObjectWithUndefined(parsedItem);
  }
  return parsedItem as T | undefined;
}

export function setLocalStorage<T>(name: string, objectLike: T | undefined): void {
  if (!objectLike) return;
  if (isObject(objectLike)) {
    const object = replaceUndefinedWithEmptyObject(objectLike);
    localStorage.setItem(name, JSON.stringify(object));
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

export function getLocalStorage<T>(name: string): T | undefined {
  const item = localStorage.getItem(name);
  if (!item) return;
  return JSON.parse(item);
}

export function setLocalStorage<T>(name: string, objectLike: T | undefined): void {
  if (objectLike) localStorage.setItem(name, JSON.stringify(objectLike));
}

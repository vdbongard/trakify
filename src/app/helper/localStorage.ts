export function getLocalStorage<T>(name: string): T | undefined {
  const item = localStorage.getItem(name);
  if (!item) return;
  return JSON.parse(item);
}

export function setLocalStorage<T>(name: string, object: T): void {
  if (Object.keys(object).length > 0) {
    localStorage.setItem(name, JSON.stringify(object));
  } else {
    localStorage.removeItem(name);
  }
}

export function getLocalStorage(name: string): object | undefined {
  const item = localStorage.getItem(name);
  if (!item) return;
  return JSON.parse(item);
}

export function setLocalStorage(name: string, object: object): void {
  if (Object.keys(object).length > 0) {
    localStorage.setItem(name, JSON.stringify(object));
  } else {
    localStorage.removeItem(name);
  }
}

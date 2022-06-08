export function getLocalStorage(name: string): object {
  return JSON.parse(localStorage.getItem(name) || '{}');
}

export function setLocalStorage(name: string, object: object): void {
  if (Object.keys(object).length > 0) {
    localStorage.setItem(name, JSON.stringify(object));
  } else {
    localStorage.removeItem(name);
  }
}

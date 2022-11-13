export function pick<T>(object: T, ...keys: (keyof T)[]): T {
  // @ts-ignore
  return Object.fromEntries(keys.filter((key) => key in object).map((key) => [key, object[key]]));
}

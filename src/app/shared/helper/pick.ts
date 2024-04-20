export function pick<T>(object: T, ...keys: (keyof T)[]): T {
  // @ts-expect-error Type { [k: string]: T[keyof T]; } is not assignable to type T
  return Object.fromEntries(keys.filter((key) => key in object).map((key) => [key, object[key]]));
}

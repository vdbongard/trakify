export function isObject(arg: unknown): boolean {
  return typeof arg === 'object' && !Array.isArray(arg) && arg !== null;
}

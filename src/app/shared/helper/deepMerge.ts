// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
export function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
export function mergeDeep<T>(target: any, ...sources: any[]): T {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        if (
          Array.isArray(target[key]) &&
          Array.isArray(source[key]) &&
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          !target[key].find((t: any): boolean => isObject(t)) &&
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          !source[key].find((t: any): boolean => isObject(t))
        ) {
          target[key] = Array.from(new Set([...target[key], ...source[key]]).keys());
        } else Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}

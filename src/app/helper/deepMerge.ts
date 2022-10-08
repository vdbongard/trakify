// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
export function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/explicit-module-boundary-types
export function mergeDeepCustom<T>(target: any, ...sources: any[]): T {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeepCustom(target[key], source[key]);
      } else {
        if (Array.isArray(target[key]) && Array.isArray(source[key])) {
          // if is no object in array
          if (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            !target[key].find((t: any): boolean => isObject(t)) &&
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            !source[key].find((t: any): boolean => isObject(t))
          ) {
            target[key] = [...new Set([...target[key], ...source[key]])];
          } else {
            for (let i = 0; i < target[key].length; i++) {
              if (target[key][i] && source[key][i]) continue;
              // override with object at that index when there is no object
              if (target[key][i] && !source[key][i]) source[key][i] = target[key][i];
            }
          }
        } else Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeepCustom(target, ...sources);
}

import { isObject } from '@helper/isObject';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
              if (!target[key][i]) {
                source[key][i] = undefined;
                continue;
              }
              if (source[key][i]) mergeDeepCustom(target[key][i], source[key][i]);
              else source[key][i] = target[key][i];
            }
          }
        } else Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeepCustom(target, ...sources);
}

import { isObject } from '@helper/isObject';

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
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
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            !target[key].find((t: any): boolean => isObject(t)) &&
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
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

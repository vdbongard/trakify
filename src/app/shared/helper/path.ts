import type { Path } from 'static-path';

export function path<T extends string, U extends string>(
  routePath: string | Path<T>,
  prefixToRemove: string | Path<U> = '',
): string {
  if (typeof routePath === 'function' && 'pattern' in routePath) {
    routePath = routePath.pattern;
  }

  if (typeof prefixToRemove === 'function' && 'pattern' in prefixToRemove) {
    prefixToRemove = prefixToRemove.pattern;
  }

  return routePath.replace(prefixToRemove + '/', '');
}

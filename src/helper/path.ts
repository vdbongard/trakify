export function path(routePath: string, prefixToRemove = ''): string {
  return routePath.replace(prefixToRemove + '/', '');
}

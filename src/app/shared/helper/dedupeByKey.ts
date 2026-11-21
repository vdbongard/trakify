export function dedupeByKey<T>(items: T[], keyFor: (item: T) => string | number): T[] {
  const seen = new Set<string | number>();
  return items.filter((item: T): boolean => {
    const key = keyFor(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

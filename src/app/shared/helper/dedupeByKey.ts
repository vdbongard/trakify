/**
 * Keeps the first item of each key, preserving order. Used to collapse a list into the items that
 * need their own fetch — one Show, or one Episode however many times it was played.
 */
export function dedupeByKey<T>(items: T[], keyFor: (item: T) => string | number): T[] {
  const seen = new Set<string | number>();
  return items.filter((item: T): boolean => {
    const key = keyFor(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

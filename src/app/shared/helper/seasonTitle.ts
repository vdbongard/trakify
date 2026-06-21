export function seasonTitle(
  seasonNumber: string | number | undefined,
  title?: string | null,
): string {
  if (seasonNumber === 0 || seasonNumber === '0') return 'Specials';
  if (title) {
    if (title.includes('Season')) return title;
    return `${title} - Season ${seasonNumber}`;
  }
  return `Season ${seasonNumber}`;
}

export function seasonTitle(seasonTitleOrNumber: string | null): string {
  if (!seasonTitleOrNumber) throw Error('Empty season title');
  if (seasonTitleOrNumber === 'Season 0') return 'Specials';
  return seasonTitleOrNumber;
}

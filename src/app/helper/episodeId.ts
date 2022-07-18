export function episodeId(
  showId: number | undefined,
  seasonNumber: number | undefined,
  episodeNumber: number | undefined
): string {
  if (!showId || seasonNumber === undefined || !episodeNumber) return '';
  return `${showId}-${seasonNumber}-${episodeNumber}`;
}

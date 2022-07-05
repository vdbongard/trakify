export function episodeId(
  showId: number | undefined,
  seasonNumber: number | undefined,
  episodeNumber: number | undefined
): string {
  if (!showId || !seasonNumber || !episodeNumber) return '';
  return `${showId}-${seasonNumber}-${episodeNumber}`;
}

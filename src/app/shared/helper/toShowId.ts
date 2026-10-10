export function toEpisodeId(
  showId: number | undefined,
  seasonNumber: number | undefined,
  episodeNumber: number | undefined,
): string {
  if (!showId || seasonNumber === undefined || !episodeNumber)
    throw Error('Argument is empty (episodeId)');
  return `${showId}-${seasonNumber}-${episodeNumber}`;
}

export function toSeasonId(showId: number | undefined, seasonNumber: number | undefined): string {
  if (!showId || seasonNumber === undefined) throw Error('Argument is empty (seasonId)');
  return `${showId}-${seasonNumber}`;
}

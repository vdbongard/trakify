export function toEpisodeId(showId: number, seasonNumber: number, episodeNumber: number): string {
  return `${showId}-${seasonNumber}-${episodeNumber}`;
}

export function toSeasonId(showId: number, seasonNumber: number): string {
  return `${showId}-${seasonNumber}`;
}

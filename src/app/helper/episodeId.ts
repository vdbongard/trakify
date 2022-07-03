export function episodeId(showId: number | undefined, season: number, episode: number): string {
  if (!showId) return '';
  return `${showId}-${season}-${episode}`;
}

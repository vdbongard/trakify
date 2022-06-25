export function episodeId(showId: number, season: number, episode: number): string {
  return `${showId}-${season}-${episode}`;
}

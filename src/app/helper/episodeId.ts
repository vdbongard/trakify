export function episodeId(
  idOrSlug: number | string | undefined | null,
  seasonNumber: number | undefined,
  episodeNumber: number | undefined
): string {
  if (!idOrSlug || seasonNumber === undefined || !episodeNumber)
    throw Error('Argument is empty (episodeId)');
  return `${idOrSlug}-${seasonNumber}-${episodeNumber}`;
}

export function seasonId(
  idOrSlug: number | string | undefined | null,
  seasonNumber: number | undefined
): string {
  if (!idOrSlug || seasonNumber === undefined) throw Error('Argument is empty (seasonId)');
  return `${idOrSlug}-${seasonNumber}`;
}

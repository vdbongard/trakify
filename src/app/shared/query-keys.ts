export const queryKeys = {
  show: (slug: string) => ['show', slug] as const,
  tmdbShow: (tmdbId: number | null | undefined, language: string) =>
    ['tmdbShow', tmdbId, language] as const,
  episodes: (traktId?: number) => ['episodes', traktId] as const,
  seasons: (traktId?: number) => ['seasons', traktId] as const,
  seasonEpisodes: (traktId?: number, seasonNumber?: number) =>
    ['seasonEpisodes', traktId, seasonNumber] as const,
};

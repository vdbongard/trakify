export const queryKeys = {
  show: (slug: string) => ['show', slug] as const,
  tmdbShow: (tmdbId: number | null | undefined, language: string) =>
    ['tmdbShow', tmdbId, language] as const,
  seasonEpisodes: (traktId?: number) => ['seasonEpisodes', traktId] as const,
};

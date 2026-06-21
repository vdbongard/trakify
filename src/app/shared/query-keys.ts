export const queryKeys = {
  show: (slug: string) => ['show', slug] as const,
  tmdbShow: (tmdbId: number | null | undefined, language: string) =>
    ['tmdbShow', tmdbId, language] as const,
  episodes: (traktId?: number) => ['episodes', traktId] as const,
  seasons: (traktId?: number) => ['seasons', traktId] as const,
  seasonEpisodes: (traktId?: number, seasonNumber?: number) =>
    ['seasonEpisodes', traktId, seasonNumber] as const,
  episode: (traktId?: number, seasonNumber?: number, episodeNumber?: number) =>
    ['episode', traktId, seasonNumber, episodeNumber] as const,
  tmdbEpisode: (tmdbId?: number | null, seasonNumber?: number, episodeNumber?: number) =>
    ['tmdbEpisode', tmdbId, seasonNumber, episodeNumber] as const,
  listItems: (slug?: string) => ['listItems', slug] as const,
};

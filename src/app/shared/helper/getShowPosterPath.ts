import type { TmdbSeason, TmdbShow } from '@type/Tmdb';

export function getShowPosterPath(
  tmdbShow?: TmdbShow | null,
  seasonNumber?: number | null,
  tmdbSeason?: TmdbSeason | null,
): string | undefined {
  const seasonPosterPath =
    (seasonNumber == null
      ? undefined
      : tmdbShow?.seasons?.find((season) => season.season_number === seasonNumber)?.poster_path) ??
    tmdbSeason?.poster_path;

  return seasonPosterPath ?? tmdbShow?.poster_path ?? undefined;
}

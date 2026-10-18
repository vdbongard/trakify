import type { TmdbSeason, TmdbShow } from '@type/Tmdb';

/**
 * Resolves which poster a show row or the Show page shows.
 *
 * A show in progress shows the poster of the season it is on rather than the show-level poster.
 * That season poster is read from the TMDB show's own `seasons` list — the response the Progress
 * list already carries — instead of from the separately fetched season detail. A list row and the
 * Show page it links to therefore resolve the same artwork before any season request lands, so the
 * poster does not change underneath the user once that request does.
 *
 * The season detail is kept as a fallback (a show response without a season list, or one that does
 * not list the season), and the show-level poster last.
 */
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

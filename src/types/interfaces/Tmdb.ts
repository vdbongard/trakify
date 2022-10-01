/* eslint-disable @typescript-eslint/naming-convention */
import { z } from 'zod';

export const crewSchema = z.object({
  adult: z.boolean(),
  credit_id: z.string(),
  department: z.string(),
  gender: z.number(),
  id: z.number(),
  job: z.string(),
  known_for_department: z.string(),
  name: z.string(),
  original_name: z.string(),
  popularity: z.number(),
  profile_path: z.string().nullable(),
});
export type Crew = z.infer<typeof crewSchema>;

export const guestStarSchema = z.object({
  id: z.number(),
  name: z.string(),
  credit_id: z.string(),
  character: z.string(),
  order: z.number(),
  profile_path: z.string().nullable(),
});
export type GuestStar = z.infer<typeof guestStarSchema>;

export const tmdbEpisodeSchema = z.object({
  air_date: z.string().nullable(),
  crew: z.array(crewSchema).optional(),
  episode_number: z.number(),
  guest_stars: z.array(guestStarSchema).optional(),
  id: z.number(),
  name: z.string(),
  overview: z.string(),
  production_code: z.string(),
  runtime: z.number().nullable(),
  season_number: z.number(),
  still_path: z.string().optional().nullable(),
  vote_average: z.number(),
  vote_count: z.number(),
});
export type TmdbEpisode = z.infer<typeof tmdbEpisodeSchema>;

export const networkSchema = z.object({
  id: z.number(),
  logo_path: z.string().nullable(),
  name: z.string(),
  origin_country: z.string(),
});
export type Network = z.infer<typeof networkSchema>;

export const productionCompanySchema = z.object({
  id: z.number(),
  logo_path: z.string().nullable(),
  name: z.string(),
  origin_country: z.string(),
});
export type ProductionCompany = z.infer<typeof productionCompanySchema>;

export const productionCountrySchema = z.object({
  iso_3166_1: z.string(),
  name: z.string(),
});
export type ProductionCountry = z.infer<typeof productionCountrySchema>;

export const tmdbShowSeasonSchema = z.object({
  air_date: z.string().nullable(),
  episode_count: z.number(),
  id: z.number(),
  name: z.string(),
  overview: z.string(),
  poster_path: z.string().nullable(),
  season_number: z.number(),
});
export type TmdbShowSeason = z.infer<typeof tmdbShowSeasonSchema>;

export const spokenLanguageSchema = z.object({
  english_name: z.string(),
  iso_639_1: z.string(),
  name: z.string(),
});
export type SpokenLanguage = z.infer<typeof spokenLanguageSchema>;

export const genreSchema = z.object({
  id: z.number(),
  name: z.string(),
});
export type Genre = z.infer<typeof genreSchema>;

export const createdBySchema = z.object({
  credit_id: z.string(),
  gender: z.number().optional(),
  id: z.number(),
  name: z.string(),
  profile_path: z.string().nullable(),
});
export type CreatedBy = z.infer<typeof createdBySchema>;

export const tmdbShowSchema = z.object({
  adult: z.boolean(),
  backdrop_path: z.string().nullable(),
  created_by: z.array(createdBySchema),
  episode_run_time: z.array(z.number()),
  first_air_date: z.string(),
  genres: z.array(genreSchema),
  homepage: z.string(),
  id: z.number(),
  in_production: z.boolean(),
  languages: z.array(z.string()),
  last_air_date: z.string().nullable(),
  last_episode_to_air: tmdbEpisodeSchema.nullable(),
  name: z.string(),
  networks: z.array(networkSchema),
  next_episode_to_air: tmdbEpisodeSchema.nullable(),
  number_of_episodes: z.number(),
  number_of_seasons: z.number(),
  origin_country: z.array(z.string()),
  original_language: z.string(),
  original_name: z.string(),
  overview: z.string(),
  popularity: z.number(),
  poster_path: z.string().nullable(),
  production_companies: z.array(productionCompanySchema),
  production_countries: z.array(productionCountrySchema),
  seasons: z.array(tmdbShowSeasonSchema),
  spoken_languages: z.array(spokenLanguageSchema),
  status: z.union([
    z.literal('Ended'),
    z.literal('Returning Series'),
    z.literal('Canceled'),
    z.literal('In Production'),
    z.literal('Planned'),
  ]),
  tagline: z.string(),
  type: z.union([
    z.literal('Scripted'),
    z.literal('Miniseries'),
    z.literal('Reality'),
    z.literal('Documentary'),
    z.literal('News'),
    z.literal('Talk Show'),
  ]),
  vote_average: z.number(),
  vote_count: z.number(),
});
export type TmdbShow = z.infer<typeof tmdbShowSchema>;

export const tmdbSeasonSchema = z.object({
  air_date: z.string().nullable(),
  episodes: z.array(tmdbEpisodeSchema),
  name: z.string(),
  overview: z.string(),
  id: z.number(),
  _id: z.string(),
  poster_path: z.string().nullable(),
  season_number: z.number(),
});
export type TmdbSeason = z.infer<typeof tmdbSeasonSchema>;

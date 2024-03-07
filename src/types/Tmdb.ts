/* eslint-disable @typescript-eslint/naming-convention */
import { z } from 'zod';

export const crewSchema = z.object({
  adult: z.boolean().optional(),
  credit_id: z.string(),
  department: z.string(),
  gender: z.number().optional(),
  id: z.number().optional(),
  job: z.string(),
  known_for_department: z.string().optional(),
  name: z.string().optional(),
  original_name: z.string().optional(),
  popularity: z.number().optional(),
  profile_path: z.string().nullable().optional(),
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
  overview: z.string().optional(),
  production_code: z.string().optional(),
  runtime: z.number().nullable().optional(),
  season_number: z.number(),
  still_path: z.string().optional().nullable(),
  vote_average: z.number().optional(),
  vote_count: z.number().optional(),
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

export const videoSchema = z.object({
  id: z.string(),
  iso_639_1: z.string(),
  iso_3166_1: z.string(),
  key: z.string(),
  name: z.string(),
  official: z.boolean(),
  published_at: z.string().datetime(),
  site: z.union([z.literal('YouTube'), z.literal('Vimeo')]),
  size: z.number(),
  type: z.union([
    z.literal('Trailer'),
    z.literal('Teaser'),
    z.literal('Opening Credits'),
    z.literal('Behind the Scenes'),
    z.literal('Featurette'),
    z.literal('Clip'),
    z.literal('Bloopers'),
  ]),
});
export type Video = z.infer<typeof videoSchema>;

export const roleSchema = z.object({
  credit_id: z.string(),
  character: z.string(),
  episode_count: z.number(),
});

export const castSchema = z.object({
  adult: z.boolean(),
  gender: z.number(),
  id: z.number(),
  known_for_department: z.string(),
  name: z.string(),
  original_name: z.string(),
  popularity: z.number(),
  profile_path: z.string().nullable(),
  roles: z.array(roleSchema),
  total_episode_count: z.number(),
  order: z.number(),
});
export type Cast = z.infer<typeof castSchema>;

export const jobSchema = z.object({
  credit_id: z.string(),
  job: z.string(),
  episode_count: z.number(),
});

export const crew2Schema = z.object({
  adult: z.boolean(),
  gender: z.number(),
  id: z.number(),
  known_for_department: z.string(),
  name: z.string(),
  original_name: z.string(),
  popularity: z.number(),
  profile_path: z.string().nullable(),
  jobs: z.array(jobSchema),
  department: z.string(),
  total_episode_count: z.number(),
});

export const tmdbShowSchema = z.object({
  adult: z.boolean().optional(),
  aggregate_credits: z
    .object({
      cast: z.array(castSchema),
      crew: z.array(crew2Schema).optional(),
    })
    .optional(),
  backdrop_path: z.string().nullable().optional(),
  created_by: z.array(createdBySchema),
  episode_run_time: z.array(z.number()),
  external_ids: z
    .object({
      facebook_id: z.string().nullable(),
      freebase_id: z.string().nullable(),
      freebase_mid: z.string().nullable(),
      imdb_id: z.string().nullable(),
      instagram_id: z.string().nullable(),
      tvdb_id: z.number().nullable(),
      tvrage_id: z.number().nullable(),
      twitter_id: z.string().nullable(),
    })
    .optional(),
  first_air_date: z.string(),
  genres: z.array(genreSchema),
  homepage: z.string(),
  id: z.number(),
  in_production: z.boolean().optional(),
  languages: z.array(z.string()).optional(),
  last_air_date: z.string().nullable().optional(),
  last_episode_to_air: tmdbEpisodeSchema.nullable().optional(),
  name: z.string(),
  networks: z.array(networkSchema).nullable(),
  next_episode_to_air: tmdbEpisodeSchema.nullable().optional(),
  number_of_episodes: z.number(),
  number_of_seasons: z.number().optional(),
  origin_country: z.array(z.string()).optional(),
  original_language: z.string().optional(),
  original_name: z.string().optional(),
  overview: z.string(),
  popularity: z.number().optional(),
  poster_path: z.string().nullable(),
  production_companies: z.array(productionCompanySchema).optional(),
  production_countries: z.array(productionCountrySchema).optional(),
  seasons: z.array(tmdbShowSeasonSchema),
  spoken_languages: z.array(spokenLanguageSchema).optional(),
  status: z.union([
    z.literal('Ended'),
    z.literal('Returning Series'),
    z.literal('Canceled'),
    z.literal('In Production'),
    z.literal('Planned'),
  ]),
  tagline: z.string().optional(),
  type: z.union([
    z.literal('Scripted'),
    z.literal('Miniseries'),
    z.literal('Reality'),
    z.literal('Documentary'),
    z.literal('News'),
    z.literal('Talk Show'),
    z.literal('Video'),
  ]),
  videos: z
    .object({
      results: z.array(videoSchema),
    })
    .optional(),
  vote_average: z.number(),
  vote_count: z.number(),
});
export type TmdbShow = z.infer<typeof tmdbShowSchema>;

export const tmdbSeasonSchema = z.object({
  air_date: z.string().nullable().optional(),
  episodes: z.array(tmdbEpisodeSchema),
  name: z.string(),
  overview: z.string().optional(),
  id: z.number(),
  _id: z.string().optional(),
  poster_path: z.string().nullable(),
  season_number: z.number().optional(),
});
export type TmdbSeason = z.infer<typeof tmdbSeasonSchema>;

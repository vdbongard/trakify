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

export const videoSchema = z.object({
  id: z.string(),
  iso_639_1: z.string(),
  iso_3166_1: z.string(),
  key: z.string(),
  name: z.string(),
  official: z.boolean(),
  published_at: z.string(),
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
  known_for_department: z.union([
    z.literal('Acting'),
    z.literal('Crew'),
    z.literal('Writing'),
    z.literal('Editing'),
  ]),
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
  job: z.union([
    z.literal('Production Design'),
    z.literal('Art Direction'),
    z.literal('Set Decoration'),
    z.literal('Director of Photography'),
    z.literal('Key Makeup Artist'),
    z.literal('Makeup Department Head'),
    z.literal('Special Effects Makeup Artist'),
    z.literal('Costume Design'),
    z.literal('Makeup Effects'),
    z.literal("Actor's Assistant"),
    z.literal('Creator'),
    z.literal('In Memory Of'),
    z.literal('Stunt Double'),
    z.literal('Director'),
    z.literal('Editor'),
    z.literal('Co-Executive Producer'),
    z.literal('Executive Producer'),
    z.literal('Consulting Producer'),
    z.literal('Casting'),
    z.literal('Producer'),
    z.literal('Unit Production Manager'),
    z.literal('Supervising Producer'),
    z.literal('Production Supervisor'),
    z.literal('Co-Producer'),
    z.literal('Casting Associate'),
    z.literal('Associate Producer'),
    z.literal('Music Producer'),
    z.literal('Original Music Composer'),
    z.literal('Music'),
    z.literal('Sound Re-Recording Mixer'),
    z.literal('Writer'),
    z.literal('Comic Book'),
    z.literal('Story'),
    z.literal('Teleplay'),
    z.literal('Author'),
  ]),
  episode_count: z.number(),
});

export const crew2Schema = z.object({
  adult: z.boolean(),
  gender: z.number(),
  id: z.number(),
  known_for_department: z.union([
    z.literal('Art'),
    z.literal('Camera'),
    z.literal('Costume & Make-Up'),
    z.literal('Crew'),
    z.literal('Writing'),
    z.literal('Acting'),
    z.literal('Directing'),
    z.literal('Editing'),
    z.literal('Production'),
    z.literal('Sound'),
  ]),
  name: z.string(),
  original_name: z.string(),
  popularity: z.number(),
  profile_path: z.string().nullable(),
  jobs: z.array(jobSchema),
  department: z.union([
    z.literal('Art'),
    z.literal('Camera'),
    z.literal('Costume & Make-Up'),
    z.literal('Crew'),
    z.literal('Directing'),
    z.literal('Editing'),
    z.literal('Production'),
    z.literal('Sound'),
    z.literal('Writing'),
  ]),
  total_episode_count: z.number(),
});

export const tmdbShowSchema = z.object({
  adult: z.boolean(),
  aggregate_credits: z.object({
    cast: z.array(castSchema),
    crew: z.array(crew2Schema),
  }),
  backdrop_path: z.string().nullable(),
  created_by: z.array(createdBySchema),
  episode_run_time: z.array(z.number()),
  external_ids: z.object({
    facebook_id: z.string().nullable(),
    freebase_id: z.string().nullable(),
    freebase_mid: z.string().nullable(),
    imdb_id: z.string().nullable(),
    instagram_id: z.string().nullable(),
    tvdb_id: z.number().nullable(),
    tvrage_id: z.number().nullable(),
    twitter_id: z.string().nullable(),
  }),
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

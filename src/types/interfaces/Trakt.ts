/* eslint-disable @typescript-eslint/naming-convention */
import { z } from 'zod';

export const episodeWatchedSchema = z.object({
  last_watched_at: z.string().nullable(),
  number: z.number(),
  plays: z.number(),
});
export type EpisodeWatched = z.infer<typeof episodeWatchedSchema>;

export const idsSchema = z.object({
  imdb: z.string().nullable(),
  slug: z.string(),
  tmdb: z.number().nullable(),
  trakt: z.number(),
  tvdb: z.number().nullable(),
  tvrage: z.number().nullable(),
});
export type Ids = z.infer<typeof idsSchema>;

export const seasonSchema = z.object({
  number: z.number(),
  ids: idsSchema.omit({ imdb: true, slug: true }),
});
export type Season = z.infer<typeof seasonSchema>;

export const episodeSchema = z.object({
  ids: idsSchema.omit({ slug: true }),
  number: z.number(),
  season: z.number(),
  title: z.string(),
});
export type Episode = z.infer<typeof episodeSchema>;

export const episodeFullSchema = episodeSchema.extend({
  number_abs: z.number().nullable(),
  overview: z.string().nullable(),
  first_aired: z.string().nullable(),
  updated_at: z.string(),
  rating: z.number(),
  votes: z.number(),
  comment_count: z.number(),
  available_translations: z.array(z.string()),
  runtime: z.number(),
  translations: z
    .array(
      z.object({
        language: z.string(),
        overview: z.string().nullable().optional(),
        title: z.string().nullable().optional(),
      })
    )
    .optional(),
});
export type EpisodeFull = z.infer<typeof episodeFullSchema>;

export const translationSchema = z
  .object({
    title: z.string().nullable().optional(),
    overview: z.string().nullable().optional(),
    language: z.string().optional(),
    country: z.string().optional(),
  })
  .optional();
export type Translation = z.infer<typeof translationSchema>;

export const episodeProgressSchema = z.object({
  completed: z.boolean(),
  last_watched_at: z.string().nullable(),
  number: z.number(),
});
export type EpisodeProgress = z.infer<typeof episodeProgressSchema>;

export const lastActivitySchema = z.object({
  all: z.string(),
  movies: z.object({
    watched_at: z.string(),
    collected_at: z.string(),
    rated_at: z.string(),
    watchlisted_at: z.string(),
    recommendations_at: z.string(),
    commented_at: z.string(),
    paused_at: z.string(),
    hidden_at: z.string(),
  }),
  episodes: z.object({
    watched_at: z.string(),
    collected_at: z.string(),
    rated_at: z.string(),
    watchlisted_at: z.string(),
    commented_at: z.string(),
    paused_at: z.string(),
  }),
  shows: z.object({
    rated_at: z.string(),
    watchlisted_at: z.string(),
    recommendations_at: z.string(),
    commented_at: z.string(),
    hidden_at: z.string(),
  }),
  comments: z.object({
    liked_at: z.string(),
    blocked_at: z.string(),
  }),
  lists: z.object({
    liked_at: z.string(),
    updated_at: z.string(),
    commented_at: z.string(),
  }),
  watchlist: z.object({
    updated_at: z.string(),
  }),
  recommendations: z.object({
    updated_at: z.string(),
  }),
  account: z.object({
    settings_at: z.string(),
    followed_at: z.string(),
    following_at: z.string(),
    pending_at: z.string(),
    requested_at: z.string(),
  }),
  collaborations: z.object({
    updated_at: z.string(),
  }),
  saved_filters: z.object({
    updated_at: z.string(),
  }),
  seasons: z.object({
    rated_at: z.string(),
    watchlisted_at: z.string(),
    commented_at: z.string(),
    hidden_at: z.string(),
  }),
});
export type LastActivity = z.infer<typeof lastActivitySchema>;

export const userIdsSchema = idsSchema.pick({ slug: true });
export type UserIds = z.infer<typeof userIdsSchema>;

export const statsSchema = z.object({
  movies: z.object({
    plays: z.number(),
    watched: z.number(),
    minutes: z.number(),
    collected: z.number(),
    ratings: z.number(),
    comments: z.number(),
  }),
  shows: z.object({
    watched: z.number(),
    collected: z.number(),
    ratings: z.number(),
    comments: z.number(),
  }),
  seasons: z.object({
    ratings: z.number(),
    comments: z.number(),
  }),
  episodes: z.object({
    plays: z.number(),
    watched: z.number(),
    minutes: z.number(),
    collected: z.number(),
    ratings: z.number(),
    comments: z.number(),
  }),
  network: z.object({
    friends: z.number(),
    followers: z.number(),
    following: z.number(),
  }),
  ratings: z.object({
    total: z.number(),
    distribution: z.object({
      1: z.number(),
      2: z.number(),
      3: z.number(),
      4: z.number(),
      5: z.number(),
      6: z.number(),
      7: z.number(),
      8: z.number(),
      9: z.number(),
      10: z.number(),
    }),
  }),
});
export type Stats = z.infer<typeof statsSchema>;

export const seasonWatchedSchema = z.object({
  episodes: z.array(episodeWatchedSchema),
  number: z.number(),
});
export type SeasonWatched = z.infer<typeof seasonWatchedSchema>;

export const showSchema = z.object({
  ids: idsSchema,
  title: z.string(),
  year: z.number().nullable(),
});
export type Show = z.infer<typeof showSchema>;

export const seasonProgressSchema = z.object({
  aired: z.number(),
  completed: z.number(),
  episodes: z.array(episodeProgressSchema),
  number: z.number(),
  title: z.string(),
});
export type SeasonProgress = z.infer<typeof seasonProgressSchema>;

export const showWatchedHistorySchema = z.object({
  action: z.literal('watch'),
  episode: episodeSchema,
  id: z.number(),
  show: showSchema,
  type: z.literal('episode'),
  watched_at: z.string(),
});
export type ShowWatchedHistory = z.infer<typeof showWatchedHistorySchema>;

export const showHiddenSchema = z.object({
  hidden_at: z.string(),
  show: showSchema,
  type: z.literal('show'),
});
export type ShowHidden = z.infer<typeof showHiddenSchema>;

export const showSearchSchema = z.object({
  score: z.number(),
  show: showSchema,
  type: z.literal('show'),
});
export type ShowSearch = z.infer<typeof showSearchSchema>;

export const trendingShowSchema = z.object({
  watchers: z.number(),
  show: showSchema,
});
export type TrendingShow = z.infer<typeof trendingShowSchema>;

export const recommendedShowSchema = z.object({
  user_count: z.number(),
  show: showSchema,
});
export type RecommendedShow = z.infer<typeof recommendedShowSchema>;

export const episodeAiringSchema = z.object({
  episode: episodeSchema,
  first_aired: z.string(),
  show: showSchema,
});
export type EpisodeAiring = z.infer<typeof episodeAiringSchema>;

export const userSchema = z.object({
  ids: userIdsSchema,
  name: z.string(),
  private: z.boolean(),
  username: z.string(),
  vip: z.boolean(),
  vip_ep: z.boolean(),
});
export type User = z.infer<typeof userSchema>;

export const showWatchedSchema = z.object({
  last_updated_at: z.string().nullable(),
  last_watched_at: z.string().nullable(),
  plays: z.number(),
  reset_at: z.string().nullable(),
  seasons: z.array(seasonWatchedSchema).optional(),
  show: showSchema,
});
export type ShowWatched = z.infer<typeof showWatchedSchema>;

export const showProgressSchema = z.object({
  aired: z.number(),
  completed: z.number(),
  last_episode: episodeSchema.nullable(),
  last_watched_at: z.string().nullable(),
  next_episode: z.union([episodeSchema, z.undefined()]).nullable(),
  reset_at: z.string().nullable(),
  seasons: z.array(seasonProgressSchema),
});
export type ShowProgress = z.infer<typeof showProgressSchema>;

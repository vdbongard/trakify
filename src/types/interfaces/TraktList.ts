/* eslint-disable @typescript-eslint/naming-convention */

import { z } from 'zod';
import { idsSchema, showSchema, userSchema } from '@type/interfaces/Trakt';

export const listIdsSchema = idsSchema.pick({ slug: true, trakt: true });
export type ListIds = z.infer<typeof listIdsSchema>;

export const listSchema = z.object({
  allow_comments: z.boolean(),
  comment_count: z.number(),
  created_at: z.string(),
  description: z.string().nullable(),
  display_numbers: z.boolean(),
  ids: listIdsSchema,
  item_count: z.number(),
  likes: z.number(),
  name: z.string(),
  privacy: z.literal('private'),
  sort_by: z.literal('rank'),
  sort_how: z.literal('asc'),
  type: z.literal('personal'),
  updated_at: z.string(),
  user: userSchema,
});
export type List = z.infer<typeof listSchema>;

export const listItemSchema = z.object({
  id: z.number(),
  listed_at: z.string(),
  notes: z.null(),
  rank: z.number(),
  show: showSchema,
  type: z.literal('show'),
});
export type ListItem = z.infer<typeof listItemSchema>;

export const watchlistItemSchema = listItemSchema.omit({ rank: true });
export type WatchlistItem = z.infer<typeof watchlistItemSchema>;

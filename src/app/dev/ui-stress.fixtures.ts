import { type Cast, type TmdbShow, tmdbShowSchema } from '@type/Tmdb';
import { type EpisodeFull, episodeFullSchema, showSchema } from '@type/Trakt';
import type { ShowInfo } from '@type/Show';

export const dataModes = [
  'demo',
  'worst',
  'empty',
  'one',
  'huge',
  'missingRole',
  'loading',
] as const;
export type DataMode = (typeof dataModes)[number];

const titles = [
  'Donaudampfschifffahrtsgesellschaftskapitän – Ein Leben auf dem Rhein',
  'The Woman in the House Across the Street from the Girl in the Window',
  '王様ランキング 勇気の宝箱',
  'نور الهدى عبد الرحمن',
  '👩🏽‍💻 The Future of Work',
  'V',
  'Law & Order: Special Victims Unit',
  'Đặng Thị Ngọc Hân',
  '',
];

const descriptions =
  'The crew follows the river through Austria, Germany and the Netherlands, meeting the people who keep its communities connected. ';

export function makeStressShow(index: number, mode: DataMode): ShowInfo {
  const unusual = mode !== 'demo' && mode !== 'one';
  const id = 900000 + index;
  const title = unusual ? titles[index % titles.length] : 'Breaking Bad';
  const show = showSchema.parse({
    ids: { trakt: id, tmdb: id, slug: `ui-stress-${index}` },
    title,
    year: index === 2 ? null : 2024,
  });
  const nextEpisode: EpisodeFull = episodeFullSchema.parse({
    ids: { trakt: id + 10000 },
    season: index === 1 ? 26 : 1,
    number: index === 1 ? 1284 : 1,
    title: index === 2 ? null : unusual ? title : 'Pilot',
    first_aired:
      index === 3 ? null : index === 4 ? '2030-01-01T00:00:00Z' : '2025-12-31T23:30:00-08:00',
    overview: index === 2 ? null : unusual ? descriptions.repeat(16) : descriptions,
  });
  const episodes = mode === 'one' ? 1 : index === 1 ? 1284 : 12;
  const tmdbShow: TmdbShow = tmdbShowSchema.parse({
    id,
    name: title,
    overview: index === 2 ? '' : unusual ? descriptions.repeat(16) : descriptions,
    poster_path: index === 1 ? '/ui-stress-missing-poster.jpg' : null,
    created_by: [
      { credit_id: 'fixture', id, name: 'Aleksandra Wiśniewska-Kowalczyk', profile_path: null },
    ],
    episode_run_time: [45],
    first_air_date: '2024-01-01',
    genres: [{ id: 18, name: 'Drama' }],
    homepage: 'https://example.com/shows/ui-stress',
    networks:
      index === 2
        ? null
        : [
            {
              id: 1,
              name: unusual ? 'ÖsterreichischerRundfunk' : 'AMC',
              logo_path: null,
              origin_country: 'AT',
            },
          ],
    number_of_episodes: episodes,
    seasons: [
      {
        id,
        name: 'Season 1',
        season_number: 1,
        episode_count: episodes,
        air_date: '2024-01-01',
        overview: '',
        poster_path: null,
      },
    ],
    status: index === 4 ? 'Planned' : 'Returning Series',
    type: 'Scripted',
    vote_average: 8.5,
    vote_count: mode === 'one' ? 1 : 1284567,
    videos: { results: [] },
  });
  const completed = mode === 'one' ? 1 : 6;
  return {
    show,
    tmdbShow,
    nextEpisode,
    isFavorite: index === 1,
    isWatchlist: false,
    showWatched: { show, plays: 1, last_updated_at: null, last_watched_at: null, reset_at: null },
    showProgress: {
      aired: episodes,
      completed,
      next_episode: mode === 'one' ? null : nextEpisode,
      last_episode: null,
      reset_at: null,
    },
  };
}

export function stressShows(mode: DataMode): ShowInfo[] {
  const count =
    mode === 'empty' || mode === 'loading'
      ? 0
      : mode === 'one'
        ? 1
        : mode === 'huge'
          ? 1284
          : mode === 'demo'
            ? 3
            : titles.length;
  return Array.from({ length: count }, (_, i) => makeStressShow(i, mode));
}

export function stressCast(mode: DataMode): Cast[] | undefined {
  if (mode === 'loading') return undefined;
  if (mode === 'empty') return [];
  const names =
    mode === 'demo'
      ? ['Bryan Cranston', 'Aaron Paul']
      : ['Aleksandra Wiśniewska-Kowalczyk', 'Jo', '王秀英', '👩🏽‍💻 Priya', 'Đặng Thị Ngọc Hân'];
  return names.slice(0, mode === 'one' ? 1 : undefined).map((name, i) => ({
    adult: false,
    gender: 0,
    id: 800000 + i,
    known_for_department: 'Acting',
    name,
    original_name: name,
    popularity: 1,
    profile_path: i === 1 ? '/ui-stress-missing-profile.jpg' : null,
    roles:
      mode === 'missingRole' && i === 0
        ? []
        : [
            {
              credit_id: `fixture-${i}`,
              character: i === 0 ? 'Senior Captain of the Danube River Fleet' : 'Self',
              episode_count: 1,
            },
          ],
    total_episode_count: 1,
    order: i,
  }));
}

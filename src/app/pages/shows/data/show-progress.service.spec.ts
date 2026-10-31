import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ShowProgressService, SYNTHETIC_EPISODE_TRAKT_ID } from './show-progress.service';
import { ShowService } from './show.service';
import { EpisodeService } from './episode.service';
import { TmdbService } from './tmdb.service';
import { TranslationService } from './translation.service';
import { makeShow } from '@shared/mocks/mockProgress';
import type { EpisodeFull, ShowProgress } from '@type/Trakt';
import type { TmdbSeason } from '@type/Tmdb';
import { toEpisodeId, toSeasonId } from '@helper/toShowId';

describe('ShowProgressService', () => {
  let service: ShowProgressService;
  let showService: ShowService;
  let episodeService: EpisodeService;
  let tmdbService: TmdbService;
  let translationService: TranslationService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    service = TestBed.inject(ShowProgressService);
    showService = TestBed.inject(ShowService);
    episodeService = TestBed.inject(EpisodeService);
    tmdbService = TestBed.inject(TmdbService);
    translationService = TestBed.inject(TranslationService);
  });

  function setProgress(showId: number, progress: Partial<ShowProgress>): void {
    showService.showsProgress.s.set({
      ...showService.showsProgress.s(),
      [showId]: progress as ShowProgress,
    });
  }

  it.each([
    ['no progress record', undefined, 'unknown'],
    ['missing next episode', {}, 'unknown'],
    ['null next episode', { next_episode: null }, 'none'],
    ['specials next episode', { next_episode: { title: null, season: 0, number: 1 } }, 'none'],
    [
      'synthetic next episode',
      {
        next_episode: {
          ids: { trakt: SYNTHETIC_EPISODE_TRAKT_ID },
          title: null,
          season: 1,
          number: 2,
        },
      },
      'pending',
    ],
    [
      'real next episode',
      { next_episode: { ids: { trakt: 42 }, title: null, season: 1, number: 2 } },
      'episode',
    ],
  ])('maps %s to an explicit Next Episode state', (_label, data, expected) => {
    const show = makeShow(1, 'Alpha');
    if (data !== undefined) setProgress(show.ids.trakt, data as Partial<ShowProgress>);

    expect(service.progress(show)().nextEpisode.state).toBe(expected);
  });

  it('returns zero remaining Episodes for an unaired Show with progress', () => {
    const show = makeShow(2, 'Unaired');
    setProgress(show.ids.trakt, { aired: 0, completed: 0, next_episode: null });

    expect(service.progress(show)()).toMatchObject({ aired: 0, completed: 0, remaining: 0 });
  });

  it('excludes specials from the Show total and keeps their Season summary', () => {
    const show = makeShow(3, 'Specials');
    setProgress(show.ids.trakt, {
      aired: 5,
      completed: 3,
      next_episode: null,
      seasons: [
        { number: 0, aired: 4, completed: 2, title: null, episodes: [] },
        { number: 1, aired: 5, completed: 3, title: null, episodes: [] },
      ],
    });

    const progress = service.progress(show)();
    expect(progress.aired).toBe(5);
    expect(progress.remaining).toBe(2);
    expect(progress.seasons.get(0)).toEqual({ aired: 4, remaining: 2 });
  });

  it('uses overview counts until season details arrive, then reflects seasonal detail', () => {
    const show = makeShow(4, 'Details');
    setProgress(show.ids.trakt, { aired: 10, completed: 3, next_episode: null });
    const progress = service.progress(show);
    expect(progress().remaining).toBe(7);

    setProgress(show.ids.trakt, {
      aired: 10,
      completed: 3,
      next_episode: null,
      seasons: [
        { number: 1, aired: 5, completed: 2, title: null, episodes: [] },
        { number: 2, aired: 7, completed: 1, title: null, episodes: [] },
      ],
    });

    expect(progress().aired).toBe(12);
    expect(progress().remaining).toBe(9);
  });

  it('uses cached TMDB season dates when available and falls back when it is not loaded', () => {
    const show = makeShow(5, 'Airing');
    setProgress(show.ids.trakt, {
      aired: 2,
      completed: 1,
      next_episode: { ids: { trakt: 52 }, title: null, season: 1, number: 4 },
      seasons: [{ number: 1, aired: 2, completed: 1, title: null, episodes: [] }],
    });
    const progress = service.progress(show);
    expect(progress().aired).toBe(2);

    const tmdbSeason: TmdbSeason = {
      id: 1,
      name: 'Season 1',
      poster_path: null,
      episodes: [
        { id: 1, season_number: 1, episode_number: 1, name: 'One', air_date: '2020-01-01' },
        { id: 2, season_number: 1, episode_number: 2, name: 'Two', air_date: '2020-01-02' },
        { id: 3, season_number: 1, episode_number: 3, name: 'Three', air_date: '2020-01-03' },
        { id: 4, season_number: 1, episode_number: 4, name: 'Four', air_date: '2099-01-01' },
      ],
    };
    tmdbService.tmdbSeasons.s.set({
      ...tmdbService.tmdbSeasons.s(),
      [toSeasonId(show.ids.tmdb!, 1)]: tmdbSeason,
    });

    expect(progress().aired).toBe(3);
    expect(progress().seasons.get(1)?.aired).toBe(3);
    expect(tmdbService.tmdbSeasons.s()[toSeasonId(show.ids.tmdb!, 1)]).toEqual(tmdbSeason);
  });

  it('keeps an ended Show without an invented Next Episode when the raw state is unknown', () => {
    const show = makeShow(6, 'Ended');
    setProgress(show.ids.trakt, { aired: 10, completed: 10 });
    tmdbService.tmdbShows.s.set({
      ...tmdbService.tmdbShows.s(),
      [show.ids.tmdb!]: { status: 'Ended' } as never,
    });

    expect(service.progress(show)().nextEpisode).toEqual({ state: 'unknown' });
  });

  it('uses stored episode detail and its translation for the Next Episode state', () => {
    const show = makeShow(7, 'Translated');
    const episodeId = toEpisodeId(show.ids.trakt, 1, 2);
    const episode: EpisodeFull = {
      ids: { trakt: 72, tmdb: 72, tvdb: 72, tvrage: 72, imdb: 'tt72' },
      season: 1,
      number: 2,
      title: 'Original title',
      first_aired: '2020-01-01T00:00:00.000Z',
    };
    setProgress(show.ids.trakt, {
      aired: 2,
      completed: 1,
      next_episode: { ids: { trakt: 72 }, season: 1, number: 2, title: 'Overview title' },
    });
    episodeService.showsEpisodes.s.set({ [episodeId]: episode });
    translationService.showsEpisodesTranslations.s.set({ [episodeId]: { title: 'Übersetzt' } });

    expect(service.progress(show)().nextEpisode).toMatchObject({
      state: 'episode',
      episode: { title: 'Übersetzt', first_aired: '2020-01-01T00:00:00.000Z' },
    });
  });

  it('preserves the overview air date and translation when detail is not stored', () => {
    const show = makeShow(8, 'Overview');
    const episodeId = toEpisodeId(show.ids.trakt, 1, 2);
    setProgress(show.ids.trakt, {
      aired: 2,
      completed: 1,
      next_episode: {
        ids: { trakt: 82 },
        season: 1,
        number: 2,
        title: 'Overview title',
        first_aired: '2026-06-26T20:00:00.000Z',
      },
    });
    translationService.showsEpisodesTranslations.s.set({ [episodeId]: { title: 'Übersetzt' } });

    expect(service.progress(show)().nextEpisode).toMatchObject({
      state: 'episode',
      episode: {
        title: 'Übersetzt',
        first_aired: '2026-06-26T20:00:00.000Z',
      },
    });
  });
});

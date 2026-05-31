import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EMPTY, firstValueFrom, Observable, of, throwError } from 'rxjs';
import { SyncService } from './sync.service';
import { TmdbService } from '../../pages/shows/data/tmdb.service';
import { ConfigService } from './config.service';
import { ShowService } from '../../pages/shows/data/show.service';
import { AuthService } from './auth.service';
import { ListService } from '../../pages/lists/data/list.service';
import { EpisodeService } from '../../pages/shows/data/episode.service';
import { TranslationService } from '../../pages/shows/data/translation.service';
import { LocalStorageService } from '@services/local-storage.service';
import { LocalStorage } from '@type/Enum';
import type { LastActivity } from '@type/Trakt';

interface Syncable<TSignal, TArgs extends unknown[] = [options?: unknown]> {
  s: WritableSignal<TSignal>;
  sync: (...args: TArgs) => Observable<void>;
}

describe('SyncService', () => {
  let service: SyncService;

  let httpMock: {
    get: ReturnType<typeof vi.fn>;
  };
  let snackBarMock: {
    open: ReturnType<typeof vi.fn>;
  };
  let authServiceMock: {
    isLoggedIn: WritableSignal<boolean>;
  };
  let localStorageServiceMock: {
    getObject: ReturnType<typeof vi.fn>;
    setObject: ReturnType<typeof vi.fn>;
  };

  let showsWatchedSyncable: Syncable<unknown[]>;
  let showsHiddenSyncable: Syncable<unknown[]>;
  let showsProgressSyncable: Syncable<Record<string, unknown>, [showId: number, options?: unknown]>;
  let favoritesSyncable: Syncable<unknown[]>;
  let tmdbSeasonsSyncable: Syncable<
    Record<string, unknown>,
    [tmdbId: number, season?: number, options?: unknown]
  >;
  let tmdbEpisodesSyncable: Syncable<
    Record<string, unknown>,
    [tmdbId: number, season?: number, episode?: number, options?: unknown]
  >;
  let watchlistSyncable: Syncable<unknown[]>;
  let listsSyncable: Syncable<unknown[]>;
  let listItemsSyncable: Syncable<Record<string, unknown>, [slug: string, options?: unknown]>;
  let showsTranslationsSyncable: Syncable<
    Record<string, unknown>,
    [showId: number, language: string, options?: unknown]
  >;
  let showsEpisodesTranslationsSyncable: Syncable<
    Record<string, unknown>,
    [showId: number, season?: number, episode?: number, language?: string, options?: unknown]
  >;
  let showsEpisodesSyncable: Syncable<
    Record<string, unknown>,
    [showId: number, season?: number, episode?: number, options?: unknown]
  >;

  let configSignal: WritableSignal<{
    language: string;
    lastFetchedAt: {
      sync: string;
      progress?: string;
      episodes?: string;
      showProgress: Record<string, string>;
    };
  }>;
  let configSyncMock: ReturnType<typeof vi.fn>;

  function createSyncable<TSignal, TArgs extends unknown[] = [options?: unknown]>(
    initial: TSignal,
  ): Syncable<TSignal, TArgs> {
    return {
      s: signal(initial) as WritableSignal<TSignal>,
      sync: vi.fn(() => of(undefined)) as unknown as (...args: TArgs) => Observable<void>,
    };
  }

  function mockShow(
    traktId: number,
    tmdbId?: number,
  ): {
    ids: { trakt: number; slug: string; tmdb?: number };
    title: string;
    year: number;
  } {
    return {
      ids: {
        trakt: traktId,
        slug: `show-${traktId}`,
        ...(tmdbId ? { tmdb: tmdbId } : {}),
      },
      title: `Show ${traktId}`,
      year: 2024,
    };
  }

  function lastActivity(date: string): LastActivity {
    return {
      all: date,
      movies: {
        watched_at: date,
        collected_at: date,
        rated_at: date,
        watchlisted_at: date,
        recommendations_at: date,
        commented_at: date,
        paused_at: date,
        hidden_at: date,
      },
      episodes: {
        watched_at: date,
        collected_at: date,
        rated_at: date,
        watchlisted_at: date,
        commented_at: date,
        paused_at: date,
      },
      shows: {
        rated_at: date,
        watchlisted_at: date,
        recommendations_at: date,
        commented_at: date,
        hidden_at: date,
      },
      comments: {
        liked_at: date,
        blocked_at: date,
      },
      lists: {
        liked_at: date,
        updated_at: date,
        commented_at: date,
      },
      watchlist: {
        updated_at: date,
      },
      recommendations: {
        updated_at: date,
      },
      account: {
        settings_at: date,
        followed_at: date,
        following_at: date,
        pending_at: date,
        requested_at: date,
      },
      collaborations: {
        updated_at: date,
      },
      saved_filters: {
        updated_at: date,
      },
      seasons: {
        rated_at: date,
        watchlisted_at: date,
        commented_at: date,
        hidden_at: date,
      },
    };
  }

  beforeEach(() => {
    httpMock = {
      get: vi.fn(),
    };

    snackBarMock = {
      open: vi.fn(() => ({
        onAction: (): Observable<unknown> => EMPTY,
      })),
    };

    authServiceMock = {
      isLoggedIn: signal(true),
    };

    localStorageServiceMock = {
      getObject: vi.fn(),
      setObject: vi.fn(),
    };

    showsWatchedSyncable = createSyncable<unknown[]>([]);
    showsHiddenSyncable = createSyncable<unknown[]>([]);
    showsProgressSyncable = createSyncable<Record<string, unknown>, [number, unknown?]>({});
    favoritesSyncable = createSyncable<unknown[]>([]);
    tmdbSeasonsSyncable = createSyncable<Record<string, unknown>, [number, number?, unknown?]>({});
    tmdbEpisodesSyncable = createSyncable<
      Record<string, unknown>,
      [number, number?, number?, unknown?]
    >({});
    watchlistSyncable = createSyncable<unknown[]>([]);
    listsSyncable = createSyncable<unknown[]>([]);
    listItemsSyncable = createSyncable<Record<string, unknown>, [string, unknown?]>({});
    showsTranslationsSyncable = createSyncable<Record<string, unknown>, [number, string, unknown?]>(
      {},
    );
    showsEpisodesTranslationsSyncable = createSyncable<
      Record<string, unknown>,
      [number, number?, number?, string?, unknown?]
    >({});
    showsEpisodesSyncable = createSyncable<
      Record<string, unknown>,
      [number, number?, number?, unknown?]
    >({});

    configSignal = signal({
      language: 'en-US',
      lastFetchedAt: {
        sync: new Date().toISOString(),
        showProgress: {},
      },
    });
    configSyncMock = vi.fn(() => of(undefined));

    const tmdbServiceMock = {
      tmdbSeasons: tmdbSeasonsSyncable,
      tmdbEpisodes: tmdbEpisodesSyncable,
    };

    const showServiceMock = {
      showsWatched: showsWatchedSyncable,
      showsHidden: showsHiddenSyncable,
      showsProgress: showsProgressSyncable,
      favorites: favoritesSyncable,
      getShows: vi.fn(() => []),
      getShows$: vi.fn(() => of([])),
      getShowsWatched$: vi.fn(() => of([])),
      removeShowProgress: vi.fn(),
    };

    const configServiceMock = {
      config: {
        s: configSignal,
        sync: configSyncMock,
      },
    };

    const listServiceMock = {
      watchlist: watchlistSyncable,
      lists: listsSyncable,
      listItems: listItemsSyncable,
    };

    const episodeServiceMock = {
      showsEpisodes: showsEpisodesSyncable,
      getEpisodes$: vi.fn(() => of({})),
      addMissingShowProgress: vi.fn(),
    };

    const translationServiceMock = {
      showsTranslations: showsTranslationsSyncable,
      showsEpisodesTranslations: showsEpisodesTranslationsSyncable,
      removeShowTranslation: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: HttpClient, useValue: httpMock },
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: LocalStorageService, useValue: localStorageServiceMock },
        { provide: TmdbService, useValue: tmdbServiceMock },
        { provide: ShowService, useValue: showServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
        { provide: ListService, useValue: listServiceMock },
        { provide: EpisodeService, useValue: episodeServiceMock },
        { provide: TranslationService, useValue: translationServiceMock },
      ],
    });

    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {});

    service = TestBed.inject(SyncService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('fetchLastActivity', () => {
    it('should request last activity endpoint', async () => {
      const fetched = lastActivity('2024-01-01T00:00:00.000Z');
      httpMock.get.mockReturnValue(of(fetched));

      const result = await firstValueFrom(service.fetchLastActivity());

      expect(httpMock.get).toHaveBeenCalledTimes(1);
      expect(result).toEqual(fetched);
    });
  });

  describe('syncShowTranslation', () => {
    it('should sync translation for non-English language', async () => {
      await firstValueFrom(service.syncShowTranslation(42, 'de'));

      expect(showsTranslationsSyncable.sync).toHaveBeenCalledWith(42, 'de', undefined);
    });

    it('should skip translation for English language', async () => {
      await firstValueFrom(service.syncShowTranslation(42, 'en'));

      expect(showsTranslationsSyncable.sync).not.toHaveBeenCalled();
    });
  });

  describe('syncEmpty', () => {
    it('should sync keys that are missing from local storage', async () => {
      localStorageServiceMock.getObject.mockImplementation((key: string) => {
        if (key === LocalStorage.SHOWS_WATCHED) return undefined;
        if (key === LocalStorage.WATCHLIST) return undefined;
        return [];
      });

      const observables = service.syncEmpty();
      await Promise.all(observables.map((obs) => firstValueFrom(obs)));

      expect(showsWatchedSyncable.sync).toHaveBeenCalled();
      expect(watchlistSyncable.sync).toHaveBeenCalled();
      expect(showsHiddenSyncable.sync).not.toHaveBeenCalled();
      expect(listsSyncable.sync).not.toHaveBeenCalled();
    });
  });

  describe('resetSubjects', () => {
    it('should reset all tracked signals', () => {
      showsWatchedSyncable.s.set([{ id: 1 }]);
      showsTranslationsSyncable.s.set({ a: { t: 'x' } });
      showsProgressSyncable.s.set({ a: { p: 1 } });
      showsHiddenSyncable.s.set([{ id: 2 }]);
      showsEpisodesSyncable.s.set({ e: { id: 3 } });
      showsEpisodesTranslationsSyncable.s.set({ e: { t: 'x' } });
      tmdbSeasonsSyncable.s.set({ s: { id: 4 } });
      tmdbEpisodesSyncable.s.set({ e: { id: 5 } });
      watchlistSyncable.s.set([{ id: 6 }]);
      listsSyncable.s.set([{ id: 7 }]);
      listItemsSyncable.s.set({ l: [{ id: 8 }] });

      service.resetSubjects();

      expect(showsWatchedSyncable.s()).toEqual([]);
      expect(showsTranslationsSyncable.s()).toEqual({});
      expect(showsProgressSyncable.s()).toEqual({});
      expect(showsHiddenSyncable.s()).toEqual([]);
      expect(showsEpisodesSyncable.s()).toEqual({});
      expect(showsEpisodesTranslationsSyncable.s()).toEqual({});
      expect(tmdbSeasonsSyncable.s()).toEqual({});
      expect(tmdbEpisodesSyncable.s()).toEqual({});
      expect(watchlistSyncable.s()).toEqual([]);
      expect(listsSyncable.s()).toEqual([]);
      expect(listItemsSyncable.s()).toEqual({});
    });
  });

  describe('syncListItems', () => {
    it('should sync list items for all lists', async () => {
      listsSyncable.s.set([{ ids: { slug: 'list-a' } }, { ids: { slug: 'list-b' } }]);

      await firstValueFrom(service.syncListItems());

      expect(listItemsSyncable.sync).toHaveBeenCalledWith('list-a', undefined);
      expect(listItemsSyncable.sync).toHaveBeenCalledWith('list-b', undefined);
    });

    it('should publish merged list items when publishSingle is false', async () => {
      const listItemsSetSpy = vi.spyOn(listItemsSyncable.s, 'set');
      listItemsSyncable.s.set({ a: [1] });

      await firstValueFrom(service.syncListItems({ publishSingle: false }));

      expect(listItemsSetSpy).toHaveBeenCalled();
    });
  });

  describe('syncShowsTranslations', () => {
    it('should sync all show translations when language is not English', async () => {
      configSignal.update((cfg) => ({ ...cfg, language: 'de-DE' }));
      const shows = [mockShow(10), mockShow(11)];
      vi.spyOn(service.showService, 'getShows$').mockReturnValue(of(shows));

      await firstValueFrom(service.syncShowsTranslations());

      expect(showsTranslationsSyncable.sync).toHaveBeenCalledWith(10, 'de', undefined);
      expect(showsTranslationsSyncable.sync).toHaveBeenCalledWith(11, 'de', undefined);
    });

    it('should skip translation syncing when language is English', async () => {
      configSignal.update((cfg) => ({ ...cfg, language: 'en-US' }));
      vi.spyOn(service.showService, 'getShows$').mockReturnValue(of([mockShow(10)]));

      await firstValueFrom(service.syncShowsTranslations());

      expect(showsTranslationsSyncable.sync).not.toHaveBeenCalled();
    });

    it('should publish merged translations when publishSingle is false', async () => {
      configSignal.update((cfg) => ({ ...cfg, language: 'de-DE' }));
      vi.spyOn(service.showService, 'getShows$').mockReturnValue(of([mockShow(10)]));
      const setSpy = vi.spyOn(showsTranslationsSyncable.s, 'set');

      await firstValueFrom(service.syncShowsTranslations({ publishSingle: false }));

      expect(setSpy).toHaveBeenCalled();
    });
  });

  describe('syncEpisode', () => {
    it('should sync episode, tmdb episode and translation when available', async () => {
      vi.spyOn(service.showService, 'getShows$').mockReturnValue(of([mockShow(1, 99)]));

      await firstValueFrom(service.syncEpisode(1, 2, 3, 'de', { force: true }));

      expect(showsEpisodesSyncable.sync).toHaveBeenCalledWith(1, 2, 3, { force: true });
      expect(tmdbEpisodesSyncable.sync).toHaveBeenCalledWith(99, 2, 3, { force: true });
      expect(showsEpisodesTranslationsSyncable.sync).toHaveBeenCalledWith(1, 2, 3, 'de', {
        force: true,
      });
    });

    it('should skip tmdb and translation when tmdb id missing and language is English', async () => {
      vi.spyOn(service.showService, 'getShows$').mockReturnValue(of([mockShow(1)]));

      await firstValueFrom(service.syncEpisode(1, 2, 3, 'en'));

      expect(showsEpisodesSyncable.sync).toHaveBeenCalledWith(1, 2, 3, undefined);
      expect(tmdbEpisodesSyncable.sync).not.toHaveBeenCalled();
      expect(showsEpisodesTranslationsSyncable.sync).not.toHaveBeenCalled();
    });
  });

  describe('syncShowsNextEpisodes', () => {
    it('should sync next episodes and watchlist episodes', async () => {
      const show10 = '10';
      configSignal.update((cfg) => ({ ...cfg, language: 'de-DE' }));
      vi.spyOn(service.showService, 'getShows$').mockReturnValue(
        of([mockShow(10, 10), mockShow(20)]),
      );
      showsProgressSyncable.s.set({
        [show10]: {
          next_episode: { season: 2, number: 4 },
        },
      });
      watchlistSyncable.s.set([{ show: { ids: { trakt: 20 } } }]);

      const syncEpisodeSpy = vi.spyOn(service, 'syncEpisode').mockReturnValue(of(undefined));

      await firstValueFrom(service.syncShowsNextEpisodes({ publishSingle: false }));

      expect(syncEpisodeSpy).toHaveBeenCalledWith(10, 2, 4, 'de', {
        publishSingle: false,
        deleteOld: true,
      });
      expect(syncEpisodeSpy).toHaveBeenCalledWith(20, 1, 1, 'de', { publishSingle: false });
      expect(tmdbSeasonsSyncable.sync).toHaveBeenCalledWith(10, 2, {
        publishSingle: false,
        deleteOld: true,
      });
    });
  });

  describe('removeUnused', () => {
    it('should inspect existing shows and complete cleanup pass', async () => {
      const id1 = '1';
      const id2 = '2';
      const id3 = '3';
      const getShowsSpy = vi.spyOn(service.showService, 'getShows').mockReturnValue([mockShow(1)]);
      showsTranslationsSyncable.s.set({ [id1]: { title: 'A' }, [id2]: { title: 'B' } });
      showsProgressSyncable.s.set({ [id1]: { progress: 1 }, [id3]: { progress: 2 } });

      await firstValueFrom(service.removeUnused());

      expect(getShowsSpy).toHaveBeenCalled();
    });
  });

  describe('syncShowsProgress', () => {
    it('removes stale show progress entries not present in watched list', async () => {
      const staleShowId = '99';
      localStorageServiceMock.getObject.mockImplementation((key: string) => {
        if (key === LocalStorage.LAST_ACTIVITY) return lastActivity('2024-01-01T00:00:00.000Z');
        return undefined;
      });
      showsProgressSyncable.s.set({ [staleShowId]: { completed: 1 } });
      const setSpy = vi.spyOn(showsProgressSyncable.s, 'set');

      await firstValueFrom(service.syncShowsProgress({ publishSingle: true }));

      expect(showsProgressSyncable.s()[staleShowId]).toBeUndefined();
      expect(setSpy).toHaveBeenCalled();
    });
  });

  describe('sync', () => {
    it('returns early when user is logged out', async () => {
      authServiceMock.isLoggedIn.set(false);

      await service.sync(lastActivity('2024-04-01T00:00:00.000Z'));

      expect(service.isSyncing()).toBe(false);
      expect(showsWatchedSyncable.sync).not.toHaveBeenCalled();
    });

    it('runs full force sync flow and persists last activity', async () => {
      const activity = lastActivity('2024-05-01T00:00:00.000Z');
      const syncShowsProgressSpy = vi
        .spyOn(service, 'syncShowsProgress')
        .mockReturnValue(of(undefined));
      const syncShowsTranslationsSpy = vi
        .spyOn(service, 'syncShowsTranslations')
        .mockReturnValue(of(undefined));
      const syncListItemsSpy = vi.spyOn(service, 'syncListItems').mockReturnValue(of(undefined));
      const syncShowsNextEpisodesSpy = vi
        .spyOn(service, 'syncShowsNextEpisodes')
        .mockReturnValue(of(undefined));
      const removeUnusedSpy = vi.spyOn(service, 'removeUnused').mockReturnValue(of(undefined));

      await service.sync(activity, { force: true, showSyncingSnackbar: true });

      expect(showsWatchedSyncable.sync).toHaveBeenCalled();
      expect(showsHiddenSyncable.sync).toHaveBeenCalled();
      expect(watchlistSyncable.sync).toHaveBeenCalled();
      expect(listsSyncable.sync).toHaveBeenCalled();
      expect(configSyncMock).toHaveBeenCalledWith({ force: true });
      expect(syncShowsProgressSpy).toHaveBeenCalled();
      expect(syncShowsTranslationsSpy).toHaveBeenCalled();
      expect(syncListItemsSpy).toHaveBeenCalled();
      expect(syncShowsNextEpisodesSpy).toHaveBeenCalled();
      expect(removeUnusedSpy).toHaveBeenCalled();
      expect(localStorageServiceMock.setObject).toHaveBeenCalledWith(
        LocalStorage.LAST_ACTIVITY,
        activity,
      );
      expect(service.isSyncing()).toBe(false);
    });

    it('handles sync errors and resets syncing flag', async () => {
      const activity = lastActivity('2024-05-01T00:00:00.000Z');
      (showsWatchedSyncable.sync as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(
        () => throwError(() => new Error('sync failed')),
      );

      await service.sync(activity, { force: true });

      expect(snackBarMock.open).toHaveBeenCalledWith('sync failed', 'Reload', {
        duration: 6000,
      });
      expect(service.isSyncing()).toBe(false);
    });
  });

  describe('syncNew', () => {
    it('should fetch last activity and trigger sync', async () => {
      const activity = lastActivity('2024-02-01T00:00:00.000Z');
      vi.spyOn(service, 'fetchLastActivity').mockReturnValue(of(activity));
      const syncSpy = vi.spyOn(service, 'sync').mockResolvedValue();

      await service.syncNew({ force: true });

      expect(syncSpy).toHaveBeenCalledWith(activity, { force: true });
    });
  });

  describe('syncAll', () => {
    it('should clear local storage keys, reset and force sync', async () => {
      const activity = lastActivity('2024-03-01T00:00:00.000Z');
      vi.spyOn(service, 'fetchLastActivity').mockReturnValue(of(activity));
      const syncSpy = vi.spyOn(service, 'sync').mockResolvedValue();
      const resetSpy = vi.spyOn(service, 'resetSubjects');

      await service.syncAll({ showSyncingSnackbar: true });

      expect(resetSpy).toHaveBeenCalled();
      expect(Storage.prototype.removeItem).toHaveBeenCalled();
      expect(syncSpy).toHaveBeenCalledWith(activity, {
        showSyncingSnackbar: true,
        force: true,
      });
    });
  });
});

import { TestBed } from '@angular/core/testing';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { signal } from '@angular/core';
import { firstValueFrom, of } from 'rxjs';
import { ShowService } from './show.service';
import { ListService } from '../../lists/data/list.service';
import { TranslationService } from './translation.service';
import { LocalStorageService } from '@services/local-storage.service';
import { SyncDataService } from '@services/sync-data.service';
import { LocalStorage } from '@type/Enum';
import type { Show, ShowWatched } from '@type/Trakt';
import { mockShow } from '@shared/mocks/mockShow';

describe('ShowService', () => {
  let service: ShowService;
  let localStorageServiceMock: {
    setObject: ReturnType<typeof vi.fn>;
    getObject: ReturnType<typeof vi.fn>;
  };
  let translationServiceMock: {
    showsTranslations: {
      s: ReturnType<typeof signal<Record<number, { title?: string }>>>;
    };
    ensureShowTranslation: ReturnType<typeof vi.fn>;
  };
  let listServiceMock: {
    watchlist: {
      s: ReturnType<typeof signal<{ show: Show }[] | undefined>>;
    };
  };
  let syncDataServiceMock: {
    syncArray: ReturnType<typeof vi.fn>;
    syncArrayPaged: ReturnType<typeof vi.fn>;
    syncObjects: ReturnType<typeof vi.fn>;
  };

  let favoritesSignal: ReturnType<typeof signal<number[] | undefined>>;
  let showsWatchedSignal: ReturnType<typeof signal<ShowWatched[] | undefined>>;
  let showsHiddenSignal: ReturnType<typeof signal<{ show: Show }[] | undefined>>;
  let showsProgressSignal: ReturnType<typeof signal<Record<number, unknown>>>;

  beforeEach(() => {
    favoritesSignal = signal<number[] | undefined>([]);
    showsWatchedSignal = signal<ShowWatched[] | undefined>([]);
    showsHiddenSignal = signal<{ show: Show }[] | undefined>([]);
    showsProgressSignal = signal<Record<number, unknown>>({});

    localStorageServiceMock = {
      setObject: vi.fn(),
      getObject: vi.fn(() => undefined),
    };

    translationServiceMock = {
      showsTranslations: {
        s: signal<Record<number, { title?: string }>>({}),
      },
      ensureShowTranslation: vi.fn(() => Promise.resolve(undefined)),
    };

    listServiceMock = {
      watchlist: {
        s: signal<{ show: Show }[] | undefined>([]),
      },
    };

    syncDataServiceMock = {
      syncArray: vi.fn((params: { localStorageKey?: LocalStorage }) => {
        if (params.localStorageKey === LocalStorage.FAVORITES) {
          return { s: favoritesSignal, sync: vi.fn(() => of(undefined)) };
        }
        return { s: signal([]), sync: vi.fn(() => of(undefined)) };
      }),
      syncArrayPaged: vi.fn((params: { localStorageKey?: LocalStorage }) => {
        if (params.localStorageKey === LocalStorage.SHOWS_WATCHED) {
          return { s: showsWatchedSignal, sync: vi.fn(() => of(undefined)) };
        }
        if (params.localStorageKey === LocalStorage.SHOWS_HIDDEN) {
          return { s: showsHiddenSignal, sync: vi.fn(() => of(undefined)) };
        }
        return { s: signal([]), sync: vi.fn(() => of(undefined)) };
      }),
      syncObjects: vi.fn(() => ({
        s: showsProgressSignal,
        syncIds: vi.fn(() => of(undefined)),
        fetchIds: vi.fn(() => of({})),
        evictWhere: vi.fn(() => undefined),
        flush: vi.fn(() => undefined),
      })),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: HttpClient, useValue: { get: vi.fn(), post: vi.fn() } },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
        { provide: ListService, useValue: listServiceMock },
        { provide: TranslationService, useValue: translationServiceMock },
        { provide: LocalStorageService, useValue: localStorageServiceMock },
        { provide: SyncDataService, useValue: syncDataServiceMock },
      ],
    });

    service = TestBed.inject(ShowService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('requests the requested page and limit for show search', async () => {
    const httpMock = TestBed.inject(HttpClient) as unknown as {
      get: ReturnType<typeof vi.fn>;
    };
    httpMock.get.mockReturnValue(of([]));

    const shows = await firstValueFrom(service.fetchSearchForShows('from', 2, 20));

    expect(httpMock.get).toHaveBeenCalledWith(
      expect.stringContaining('/search/show?query=from&page=2&limit=20'),
    );
    expect(shows).toEqual([]);
  });

  it('fetches cast people for a show', async () => {
    const httpMock = TestBed.inject(HttpClient) as unknown as {
      get: ReturnType<typeof vi.fn>;
    };
    httpMock.get.mockReturnValue(
      of({
        cast: [
          {
            person: {
              ids: {
                slug: 'chloe-van-landschoot-7b945d92-1b09-47d3-b5dd-64d194700ca1',
                tmdb: 1234,
              },
            },
          },
        ],
      }),
    );

    const people = await firstValueFrom(service.fetchShowPeople(mockShow.ids.trakt));

    expect(httpMock.get).toHaveBeenCalledWith(
      expect.stringContaining(`/shows/${mockShow.ids.trakt}/people`),
    );
    expect(people.cast?.[0].person.ids.tmdb).toBe(1234);
    expect(people.cast?.[0].person.ids.slug).toBe(
      'chloe-van-landschoot-7b945d92-1b09-47d3-b5dd-64d194700ca1',
    );
  });

  describe('favorites', () => {
    it('should add favorite for missing favorites array', () => {
      favoritesSignal.set(undefined);

      service.addFavorite(mockShow);

      expect(service.favorites.s()).toEqual([mockShow.ids.trakt]);
      expect(localStorageServiceMock.setObject).toHaveBeenCalledWith(LocalStorage.FAVORITES, [
        mockShow.ids.trakt,
      ]);
    });

    it('should append favorite when not already present', () => {
      const syncSpy = vi.fn(() => of(undefined));
      service.favorites.sync = syncSpy;
      favoritesSignal.set([1, 2]);

      service.addFavorite(mockShow);

      expect(service.favorites.s()).toEqual([1, 2, mockShow.ids.trakt]);
      expect(syncSpy).toHaveBeenCalled();
    });

    it('should remove favorite and sync deferred', () => {
      const syncSpy = vi.fn(() => of(undefined));
      service.favorites.sync = syncSpy;
      favoritesSignal.set([mockShow.ids.trakt, 2]);

      service.removeFavorite(mockShow);

      expect(service.favorites.s()).toEqual([2]);
      expect(syncSpy).toHaveBeenCalledWith({ deferPublish: true });
    });

    it('should return favorite and hidden flags', () => {
      favoritesSignal.set([mockShow.ids.trakt]);
      showsHiddenSignal.set([{ show: mockShow }]);

      expect(service.isFavorite(mockShow)).toBe(true);
      expect(service.isHidden(mockShow)).toBe(true);
      expect(service.isFavorite(undefined)).toBe(false);
      expect(service.isHidden(undefined)).toBe(false);
    });
  });

  describe('watchlist and watched updates', () => {
    it('should combine watched and watchlist shows', () => {
      showsWatchedSignal.set([{ show: mockShow } as ShowWatched]);
      listServiceMock.watchlist.s.set([
        {
          show: {
            ...mockShow,
            ids: { ...mockShow.ids, trakt: 999, slug: 'other-show' },
          },
        },
      ]);

      const shows = service.getShows();

      expect(shows).toHaveLength(2);
      expect(shows[0].ids.trakt).toBe(mockShow.ids.trakt);
      expect(shows[1].ids.trakt).toBe(999);
    });

    it('should update watched list and persist', () => {
      const watched = [{ show: mockShow } as ShowWatched];

      service.updateShowsWatched(watched);

      expect(service.showsWatched.s()).toEqual(watched);
      expect(localStorageServiceMock.setObject).toHaveBeenCalledWith(
        LocalStorage.SHOWS_WATCHED,
        watched,
      );
    });

    it('should remove watched show and persist', () => {
      const otherShow: Show = {
        ...mockShow,
        ids: { ...mockShow.ids, trakt: 99, slug: 'x' },
      };
      showsWatchedSignal.set([
        { show: mockShow } as ShowWatched,
        { show: otherShow } as ShowWatched,
      ]);

      service.removeShowWatched(mockShow);

      expect(service.showsWatched.s()).toEqual([{ show: otherShow }]);
      expect(localStorageServiceMock.setObject).toHaveBeenCalledWith(LocalStorage.SHOWS_WATCHED, [
        { show: otherShow },
      ]);
    });

    it('should move watched show to front', () => {
      const show1: Show = { ...mockShow, ids: { ...mockShow.ids, trakt: 1, slug: 'one' } };
      const show2: Show = { ...mockShow, ids: { ...mockShow.ids, trakt: 2, slug: 'two' } };
      showsWatchedSignal.set([{ show: show1 } as ShowWatched, { show: show2 } as ShowWatched]);

      service.moveShowWatchedToFront(1);

      expect(service.showsWatched.s()?.[0].show.ids.trakt).toBe(2);
    });

    it('should return watched index', () => {
      const show1: Show = { ...mockShow, ids: { ...mockShow.ids, trakt: 1, slug: 'one' } };
      const show2: Show = { ...mockShow, ids: { ...mockShow.ids, trakt: 2, slug: 'two' } };
      showsWatchedSignal.set([{ show: show1 } as ShowWatched, { show: show2 } as ShowWatched]);

      expect(service.getShowWatchedIndex(show2)).toBe(1);
    });
  });

  describe('searchForAddedShows$', () => {
    it('should return starts-with matches first', async () => {
      const alpha: Show = { ...mockShow, title: 'Alpha Beta' };
      const beta: Show = {
        ...mockShow,
        title: 'The Alpha',
        ids: { ...mockShow.ids, trakt: 20, slug: 'the-alpha' },
      };

      showsWatchedSignal.set([{ show: alpha } as ShowWatched, { show: beta } as ShowWatched]);
      listServiceMock.watchlist.s.set([]);
      translationServiceMock.showsTranslations.s.set({
        [alpha.ids.trakt]: { title: 'Alpha Localized' },
      });

      const result = await firstValueFrom(service.searchForAddedShows$('alpha'));

      expect(result).toHaveLength(2);
      expect(result[0].title.toLowerCase().startsWith('alpha')).toBe(true);
    });
  });

  describe('progress utilities', () => {
    it('should update shows progress and save by default', () => {
      const progress = { [mockShow.ids.trakt]: { aired: 1, completed: 0 } } as never;

      service.updateShowsProgress(progress);

      expect(service.showsProgress.s()).toEqual(progress);
      expect(localStorageServiceMock.setObject).toHaveBeenCalledWith(
        LocalStorage.SHOWS_PROGRESS,
        progress,
      );
    });

    it('should update shows progress without saving when disabled', () => {
      const progress = { [mockShow.ids.trakt]: { aired: 1, completed: 1 } } as never;

      service.updateShowsProgress(progress, { save: false });

      expect(service.showsProgress.s()).toEqual(progress);
      expect(localStorageServiceMock.setObject).not.toHaveBeenCalledWith(
        LocalStorage.SHOWS_PROGRESS,
        progress,
      );
    });

    it('should return show progress for given show', () => {
      showsProgressSignal.set({ [mockShow.ids.trakt]: { aired: 10, completed: 5 } });

      expect(service.getShowProgress(mockShow)).toEqual({ aired: 10, completed: 5 });
    });

    it('should update overview-shaped entries through the unified store', () => {
      const overview = { [mockShow.ids.trakt]: { aired: 10, completed: 5 } } as never;

      service.updateShowsProgress(overview);

      expect(service.showsProgress.s()).toEqual(overview);
      expect(localStorageServiceMock.setObject).toHaveBeenCalledWith(
        LocalStorage.SHOWS_PROGRESS,
        overview,
      );
    });

    it('should serve overview-shaped entries through getShowProgress', () => {
      showsProgressSignal.set({ [mockShow.ids.trakt]: { aired: 10, completed: 5 } });

      expect(service.getShowProgress(mockShow)).toEqual({ aired: 10, completed: 5 });
    });
  });

  describe('unified show progress', () => {
    it('should migrate legacy overview entries into the unified store', () => {
      localStorageServiceMock.getObject.mockImplementation((key: string) => {
        if (key === LocalStorage.SHOWS_PROGRESS_OVERVIEW) {
          return {
            [mockShow.ids.trakt]: { aired: 10, completed: 4, next_episode: null },
          };
        }
        return undefined;
      });
      const removeSpy = vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {});

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          { provide: HttpClient, useValue: { get: vi.fn(), post: vi.fn() } },
          { provide: MatSnackBar, useValue: { open: vi.fn() } },
          { provide: ListService, useValue: listServiceMock },
          { provide: TranslationService, useValue: translationServiceMock },
          { provide: LocalStorageService, useValue: localStorageServiceMock },
          { provide: SyncDataService, useValue: syncDataServiceMock },
        ],
      });
      const migrated = TestBed.inject(ShowService);

      expect(migrated.getShowProgress(mockShow)).toMatchObject({ aired: 10, completed: 4 });
      expect(localStorageServiceMock.setObject).toHaveBeenCalledWith(
        LocalStorage.SHOWS_PROGRESS,
        expect.anything(),
      );
      expect(removeSpy).toHaveBeenCalledWith(LocalStorage.SHOWS_PROGRESS_OVERVIEW);
      removeSpy.mockRestore();
    });

    it('should mark an episode seen with a single converged write', () => {
      const next = { ids: { trakt: 2 }, season: 1, number: 2, title: 'Ep 2' };
      showsProgressSignal.set({
        [mockShow.ids.trakt]: {
          aired: 10,
          completed: 5,
          next_episode: next,
          seasons: [{ number: 1, aired: 10, completed: 5, episodes: [{ number: 2 }] }],
        },
      });

      const advanced = service.markEpisodeSeen(mockShow, {
        ids: { trakt: 2 },
        season: 1,
        number: 2,
      } as never);

      expect(advanced).toBe(true);
      const progress = service.getShowProgress(mockShow) as unknown as Record<string, never>;
      expect(progress['completed']).toBe(6);
      expect(progress['next_episode']).toMatchObject({ season: 1, number: 3 });
      expect(localStorageServiceMock.setObject).toHaveBeenCalledTimes(1);
      expect(localStorageServiceMock.setObject).toHaveBeenCalledWith(
        LocalStorage.SHOWS_PROGRESS,
        expect.anything(),
      );
    });

    it('should not mark when no progress record exists', () => {
      expect(
        service.markEpisodeSeen(mockShow, { ids: { trakt: 1 }, season: 1, number: 1 } as never),
      ).toBe(false);
      expect(localStorageServiceMock.setObject).not.toHaveBeenCalled();
    });

    it('should unmark an episode with a single converged write', () => {
      const watched = { ids: { trakt: 2 }, season: 1, number: 2, title: 'Ep 2' };
      showsProgressSignal.set({
        [mockShow.ids.trakt]: {
          aired: 10,
          completed: 6,
          next_episode: { ids: { trakt: 0 }, season: 1, number: 3, title: null },
          seasons: [
            {
              number: 1,
              aired: 10,
              completed: 6,
              episodes: [{ number: 2, completed: true, last_watched_at: 'x' }],
            },
          ],
        },
      });

      service.unmarkEpisodeSeen(mockShow, watched as never);

      const progress = service.getShowProgress(mockShow) as unknown as Record<string, never>;
      expect(progress['completed']).toBe(5);
      expect(progress['next_episode']).toEqual(watched);
      expect(localStorageServiceMock.setObject).toHaveBeenCalledWith(
        LocalStorage.SHOWS_PROGRESS,
        expect.anything(),
      );
    });

    it('should clear the next episode when a show ends', () => {
      showsProgressSignal.set({
        [mockShow.ids.trakt]: {
          aired: 10,
          completed: 10,
          next_episode: { ids: { trakt: 0 }, season: 1, number: 11, title: null },
        },
      });

      service.clearNextEpisode(mockShow);

      expect(
        (service.getShowProgress(mockShow) as unknown as Record<string, never>)['next_episode'],
      ).toBeNull();
    });

    it('should backfill aired entries from the episode store', () => {
      showsProgressSignal.set({
        [mockShow.ids.trakt]: { aired: 1, completed: 0, next_episode: null },
      });

      service.reconcileAiredEntries({
        [`${mockShow.ids.trakt}-1-2`]: {
          season: 1,
          number: 2,
          first_aired: '2020-01-01T00:00:00.000Z',
        } as never,
      });

      const progress = service.getShowProgress(mockShow) as unknown as Record<string, never>;
      expect(progress['seasons']).toHaveLength(1);
      expect(progress['aired']).toBe(1);
      expect(localStorageServiceMock.setObject).toHaveBeenCalledWith(
        LocalStorage.SHOWS_PROGRESS,
        expect.anything(),
      );
    });

    it('should merge bulk overview sync without dropping seasonal detail', async () => {
      showsProgressSignal.set({
        [mockShow.ids.trakt]: {
          aired: 10,
          completed: 5,
          next_episode: { season: 1, number: 2 },
          seasons: [{ number: 1, aired: 10, completed: 5, episodes: [] }],
        },
      });
      const httpMock = TestBed.inject(HttpClient) as unknown as {
        get: ReturnType<typeof vi.fn>;
      };
      httpMock.get.mockImplementation((url: string) =>
        url.includes('page=1&')
          ? of([
              {
                show: mockShow,
                progress: {
                  aired: 10,
                  completed: 6,
                  last_episode: null,
                  last_watched_at: null,
                  next_episode: { season: 1, number: 3 },
                  reset_at: null,
                },
              },
            ])
          : of([]),
      );

      await firstValueFrom(service.syncShowsProgress());

      const progress = service.getShowProgress(mockShow) as unknown as Record<string, never>;
      expect(progress['completed']).toBe(6);
      expect(progress['seasons']).toHaveLength(1);
    });
  });

  describe('error branches', () => {
    it('should throw when watched list missing for index lookup', () => {
      showsWatchedSignal.set(undefined);

      expect(() => service.getShowWatchedIndex(mockShow)).toThrow('Shows watched empty');
    });

    it('should throw when moving watched list and list missing', () => {
      showsWatchedSignal.set(undefined);

      expect(() => service.moveShowWatchedToFront(0)).toThrow('Shows watched empty');
    });

    it('should throw when show progress store missing', () => {
      service.showsProgress.s = signal(undefined as never);

      expect(() => service.getShowProgress(mockShow)).toThrow('Shows progress empty');
    });
  });
});

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
  };
  let translationServiceMock: {
    showsTranslations: {
      s: ReturnType<typeof signal<Record<number, { title?: string }>>>;
    };
    getShowTranslation$: ReturnType<typeof vi.fn>;
  };
  let listServiceMock: {
    watchlist: {
      s: ReturnType<typeof signal<{ show: Show }[] | undefined>>;
    };
  };
  let syncDataServiceMock: {
    syncArray: ReturnType<typeof vi.fn>;
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
    };

    translationServiceMock = {
      showsTranslations: {
        s: signal<Record<number, { title?: string }>>({}),
      },
      getShowTranslation$: vi.fn(() => of(undefined)),
    };

    listServiceMock = {
      watchlist: {
        s: signal<{ show: Show }[] | undefined>([]),
      },
    };

    syncDataServiceMock = {
      syncArray: vi.fn((params: { localStorageKey?: LocalStorage }) => {
        if (params.localStorageKey === LocalStorage.SHOWS_WATCHED) {
          return { s: showsWatchedSignal, sync: vi.fn(() => of(undefined)) };
        }
        if (params.localStorageKey === LocalStorage.SHOWS_HIDDEN) {
          return { s: showsHiddenSignal, sync: vi.fn(() => of(undefined)) };
        }
        if (params.localStorageKey === LocalStorage.FAVORITES) {
          return { s: favoritesSignal, sync: vi.fn(() => of(undefined)) };
        }
        return { s: signal([]), sync: vi.fn(() => of(undefined)) };
      }),
      syncObjects: vi.fn(() => ({
        s: showsProgressSignal,
        sync: vi.fn(() => of(undefined)),
        fetch: vi.fn(() => of({})),
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

    it('should remove favorite and sync without publishSingle', () => {
      const syncSpy = vi.fn(() => of(undefined));
      service.favorites.sync = syncSpy;
      favoritesSignal.set([mockShow.ids.trakt, 2]);

      service.removeFavorite(mockShow);

      expect(service.favorites.s()).toEqual([2]);
      expect(syncSpy).toHaveBeenCalledWith({ publishSingle: false });
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

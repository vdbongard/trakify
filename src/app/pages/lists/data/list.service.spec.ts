import { TestBed } from '@angular/core/testing';
import { ListService } from './list.service';
import { HttpClient } from '@angular/common/http';
import { signal } from '@angular/core';
import { firstValueFrom, of } from 'rxjs';
import { TranslationService } from '../../shows/data/translation.service';
import { LocalStorageService } from '@services/local-storage.service';
import { SyncDataService } from '@services/sync-data.service';
import { LocalStorage } from '@type/Enum';
import type { List, ListItem, WatchlistItem } from '@type/TraktList';
import type { Show } from '@type/Trakt';
import { mockShow } from '@shared/mocks/mockShow';

describe('ListService', () => {
  let service: ListService;
  let httpMock: {
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
  };
  let localStorageServiceMock: {
    setObject: ReturnType<typeof vi.fn>;
  };
  let translationServiceMock: {
    showsTranslations: {
      s: ReturnType<typeof signal<Record<number, { title?: string }>>>;
    };
  };
  let syncDataServiceMock: {
    syncArray: ReturnType<typeof vi.fn>;
    syncArrays: ReturnType<typeof vi.fn>;
  };

  let watchlistSignal: ReturnType<typeof signal<WatchlistItem[] | undefined>>;
  let listsSignal: ReturnType<typeof signal<List[] | undefined>>;
  let listItemsSignal: ReturnType<typeof signal<Record<string, ListItem[] | undefined>>>;

  const mockList: List = {
    allow_comments: true,
    comment_count: 0,
    created_at: '2024-01-01T00:00:00Z',
    description: null,
    display_numbers: true,
    ids: { slug: 'favorites', trakt: 10 },
    item_count: 1,
    likes: 0,
    name: 'Favorites',
    privacy: 'public',
    sort_by: 'rank',
    sort_how: 'asc',
    type: 'personal',
    updated_at: '2024-01-01T00:00:00Z',
    user: {
      ids: { slug: 'me' },
      name: 'Me',
      private: false,
      username: 'me',
      vip: false,
      vip_ep: false,
    },
  };

  const mockListItem: ListItem = {
    id: 1,
    listed_at: '2024-01-01T00:00:00Z',
    notes: null,
    rank: 1,
    show: mockShow,
    type: 'show',
  };

  const mockWatchlistItem: WatchlistItem = {
    id: 1,
    listed_at: '2024-01-01T00:00:00Z',
    notes: null,
    show: mockShow,
    type: 'show',
  };

  beforeEach(() => {
    watchlistSignal = signal<WatchlistItem[] | undefined>([]);
    listsSignal = signal<List[] | undefined>([]);
    listItemsSignal = signal<Record<string, ListItem[] | undefined>>({});

    httpMock = {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
    };

    localStorageServiceMock = {
      setObject: vi.fn(),
    };

    translationServiceMock = {
      showsTranslations: {
        s: signal<Record<number, { title?: string }>>({}),
      },
    };

    syncDataServiceMock = {
      syncArray: vi.fn((params: { localStorageKey: LocalStorage }) => {
        if (params.localStorageKey === LocalStorage.WATCHLIST) {
          return {
            s: watchlistSignal,
            sync: vi.fn(() => of(undefined)),
          };
        }

        return {
          s: listsSignal,
          sync: vi.fn(() => of(undefined)),
        };
      }),
      syncArrays: vi.fn(() => ({
        s: listItemsSignal,
        sync: vi.fn(() => of(undefined)),
        fetch: vi.fn(() => of([])),
      })),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: HttpClient, useValue: httpMock },
        { provide: TranslationService, useValue: translationServiceMock },
        { provide: LocalStorageService, useValue: localStorageServiceMock },
        { provide: SyncDataService, useValue: syncDataServiceMock },
      ],
    });

    service = TestBed.inject(ListService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add list with default user id', async () => {
    httpMock.post.mockReturnValue(of(mockList));

    await firstValueFrom(service.addList({ name: 'Favorites' }));

    expect(httpMock.post).toHaveBeenCalledWith(
      'https://api.trakt.tv/users/me/lists',
      expect.objectContaining({ name: 'Favorites' }),
    );
  });

  it('should remove list for provided user id', async () => {
    httpMock.delete.mockReturnValue(of(undefined));

    await firstValueFrom(service.removeList({ ids: { slug: 'watch', trakt: 5 } }, 'tester'));

    expect(httpMock.delete).toHaveBeenCalledWith('https://api.trakt.tv/users/tester/lists/watch');
  });

  it('should add and remove a show from watchlist', async () => {
    httpMock.post.mockReturnValue(of({}));

    await firstValueFrom(service.addToWatchlist(mockShow));
    await firstValueFrom(service.removeFromWatchlist(mockShow));

    expect(httpMock.post).toHaveBeenNthCalledWith(1, 'https://api.trakt.tv/sync/watchlist', {
      shows: [{ ids: mockShow.ids }],
    });
    expect(httpMock.post).toHaveBeenNthCalledWith(2, 'https://api.trakt.tv/sync/watchlist/remove', {
      shows: [{ ids: mockShow.ids }],
    });
  });

  it('should add and remove shows by list id', async () => {
    httpMock.post.mockReturnValue(of({}));

    await firstValueFrom(service.addShowsToList(11, [1, 2]));
    await firstValueFrom(service.removeShowsFromList(11, [2], 'tester'));

    expect(httpMock.post).toHaveBeenNthCalledWith(
      1,
      'https://api.trakt.tv/users/me/lists/11/items',
      {
        shows: [{ ids: { trakt: 1 } }, { ids: { trakt: 2 } }],
      },
    );
    expect(httpMock.post).toHaveBeenNthCalledWith(
      2,
      'https://api.trakt.tv/users/tester/lists/11/items/remove',
      {
        shows: [{ ids: { trakt: 2 } }],
      },
    );
  });

  describe('getListItems$', () => {
    it('should return empty array when list slug is missing', async () => {
      const items = await firstValueFrom(service.getListItems$(undefined));
      expect(items).toEqual([]);
    });

    it('should map existing list items with translations', async () => {
      listItemsSignal.set({ favorites: [mockListItem] });
      translationServiceMock.showsTranslations.s.set({
        [mockShow.ids.trakt]: { title: 'Translated show' },
      });

      const items = await firstValueFrom(service.getListItems$('favorites'));

      expect(items).toHaveLength(1);
      expect(items?.[0].show.title).toBe('Translated show');
    });

    it('should fetch list items when missing and fetch is true', async () => {
      const fetchedItem = { ...mockListItem, show: { ...mockShow, title: 'Fetched title' } };
      const fetchMock = vi.fn(() => of([fetchedItem]));
      (service.listItems.fetch as unknown as ReturnType<typeof vi.fn>) = fetchMock;

      const items = await firstValueFrom(service.getListItems$('favorites', true, true));

      expect(fetchMock).toHaveBeenCalledWith('favorites', true);
      expect(items).toEqual([fetchedItem]);
    });
  });

  it('should map watchlist items with translations', async () => {
    watchlistSignal.set([mockWatchlistItem]);
    translationServiceMock.showsTranslations.s.set({
      [mockShow.ids.trakt]: { title: 'Localized' },
    });

    const items = await firstValueFrom(service.getWatchlistItems$());

    expect(items).toHaveLength(1);
    expect(items[0].show.title).toBe('Localized');
  });

  it('should update watchlist and save local storage', () => {
    const items = [mockWatchlistItem];

    service.updateWatchlist(items);

    expect(service.watchlist.s()).toEqual(items);
    expect(localStorageServiceMock.setObject).toHaveBeenCalledWith(LocalStorage.WATCHLIST, items);
  });

  describe('watchlist optimistic operations', () => {
    it('should add show to watchlist optimistically', () => {
      watchlistSignal.set([]);

      service.addToWatchlistOptimistically(mockShow);

      expect(service.watchlist.s()).toHaveLength(1);
      expect(service.watchlist.s()?.[0].show.ids.trakt).toBe(mockShow.ids.trakt);
    });

    it('should throw when adding optimistically and watchlist is missing', () => {
      watchlistSignal.set(undefined);

      expect(() => service.addToWatchlistOptimistically(mockShow)).toThrow('Watchlist empty');
    });

    it('should remove existing show optimistically', () => {
      const otherShow: Show = {
        ...mockShow,
        ids: { ...mockShow.ids, trakt: 999, slug: 'other-show' },
      };
      watchlistSignal.set([mockWatchlistItem, { ...mockWatchlistItem, id: 2, show: otherShow }]);

      service.removeFromWatchlistOptimistically(mockShow);

      expect(service.watchlist.s()).toHaveLength(1);
      expect(service.watchlist.s()?.[0].show.ids.trakt).toBe(999);
    });

    it('should throw when removing optimistically and watchlist is missing', () => {
      watchlistSignal.set(undefined);

      expect(() => service.removeFromWatchlistOptimistically(mockShow)).toThrow('Watchlist empty');
    });
  });

  it('should detect if show is in watchlist', () => {
    watchlistSignal.set([mockWatchlistItem]);

    expect(service.isWatchlistItem(service.watchlist.s(), mockShow)).toBe(true);
    expect(
      service.isWatchlistItem(service.watchlist.s(), {
        ...mockShow,
        ids: { ...mockShow.ids, trakt: 333, slug: 'not-in-list' },
      }),
    ).toBe(false);
  });
});

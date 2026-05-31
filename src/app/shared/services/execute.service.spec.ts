import { signal, WritableSignal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EMPTY, of, throwError } from 'rxjs';
import { ExecuteService } from './execute.service';
import { TmdbService } from '../../pages/shows/data/tmdb.service';
import { ShowService } from '../../pages/shows/data/show.service';
import { ConfigService } from './config.service';
import { ListService } from '../../pages/lists/data/list.service';
import { EpisodeService } from '../../pages/shows/data/episode.service';
import { TranslationService } from '../../pages/shows/data/translation.service';
import { DialogService } from './dialog.service';
import { SyncService } from './sync.service';
import { SeasonService } from '../../pages/shows/data/season.service';
import type { LoadingState } from '@type/Loading';

describe('ExecuteService', () => {
  let service: ExecuteService;

  let snackBarMock: {
    open: ReturnType<typeof vi.fn>;
  };

  let showServiceMock: {
    addShowAsSeen: ReturnType<typeof vi.fn>;
    removeShowAsSeen: ReturnType<typeof vi.fn>;
    addShowHidden: ReturnType<typeof vi.fn>;
    removeShowHidden: ReturnType<typeof vi.fn>;
    removeShowWatched: ReturnType<typeof vi.fn>;
    removeShowProgress: ReturnType<typeof vi.fn>;
    removeFavorite: ReturnType<typeof vi.fn>;
    updateShowsHidden: ReturnType<typeof vi.fn>;
    showsHidden: { s: WritableSignal<unknown[]> };
    showsProgress: { sync: ReturnType<typeof vi.fn> };
  };

  let listServiceMock: {
    addToWatchlistOptimistically: ReturnType<typeof vi.fn>;
    removeFromWatchlistOptimistically: ReturnType<typeof vi.fn>;
    addToWatchlist: ReturnType<typeof vi.fn>;
    removeFromWatchlist: ReturnType<typeof vi.fn>;
    removeList: ReturnType<typeof vi.fn>;
    watchlist: { sync: ReturnType<typeof vi.fn> };
    lists: { sync: ReturnType<typeof vi.fn> };
  };

  let syncServiceMock: {
    syncNew: ReturnType<typeof vi.fn>;
    syncShowTranslation: ReturnType<typeof vi.fn>;
    syncEpisode: ReturnType<typeof vi.fn>;
  };

  let translationServiceMock: {
    removeShowTranslation: ReturnType<typeof vi.fn>;
    removeShowsEpisodesTranslation: ReturnType<typeof vi.fn>;
  };

  let episodeServiceMock: {
    addEpisode: ReturnType<typeof vi.fn>;
    removeEpisode: ReturnType<typeof vi.fn>;
    removeShowsEpisodes: ReturnType<typeof vi.fn>;
  };

  let tmdbServiceMock: {
    removeShow: ReturnType<typeof vi.fn>;
    tmdbShows: { sync: ReturnType<typeof vi.fn> };
  };

  let dialogServiceMock: {
    confirm: ReturnType<typeof vi.fn>;
  };

  let seasonServiceMock: {
    getSeasonFromNumber$: ReturnType<typeof vi.fn>;
    addSeason: ReturnType<typeof vi.fn>;
    removeSeason: ReturnType<typeof vi.fn>;
  };

  const show = {
    ids: {
      trakt: 7,
      tmdb: 77,
    },
  } as never;

  const episode = {
    season: 1,
    number: 2,
  } as never;

  const season = {
    number: 1,
  } as never;

  beforeEach(() => {
    snackBarMock = {
      open: vi.fn(() => ({
        dismiss: vi.fn(),
        onAction: vi.fn(() => EMPTY),
      })),
    };

    showServiceMock = {
      addShowAsSeen: vi.fn(() => of({ not_found: { shows: [] } })),
      removeShowAsSeen: vi.fn(() => of({ not_found: { shows: [] } })),
      addShowHidden: vi.fn(() => of({ not_found: { shows: [] } })),
      removeShowHidden: vi.fn(() => of({ not_found: { shows: [] } })),
      removeShowWatched: vi.fn(),
      removeShowProgress: vi.fn(),
      removeFavorite: vi.fn(),
      updateShowsHidden: vi.fn(),
      showsHidden: {
        s: signal([]),
      },
      showsProgress: {
        sync: vi.fn(() => of(undefined)),
      },
    };

    listServiceMock = {
      addToWatchlistOptimistically: vi.fn(),
      removeFromWatchlistOptimistically: vi.fn(),
      addToWatchlist: vi.fn(() => of({ not_found: { shows: [] } })),
      removeFromWatchlist: vi.fn(() => of({ not_found: { shows: [] } })),
      removeList: vi.fn(() => of(undefined)),
      watchlist: {
        sync: vi.fn(() => of(undefined)),
      },
      lists: {
        sync: vi.fn(() => of(undefined)),
      },
    };

    syncServiceMock = {
      syncNew: vi.fn(async () => undefined),
      syncShowTranslation: vi.fn(() => of(undefined)),
      syncEpisode: vi.fn(() => of(undefined)),
    };

    translationServiceMock = {
      removeShowTranslation: vi.fn(),
      removeShowsEpisodesTranslation: vi.fn(),
    };

    episodeServiceMock = {
      addEpisode: vi.fn(() => of({ not_found: { episodes: [] } })),
      removeEpisode: vi.fn(() => of({ not_found: { episodes: [] } })),
      removeShowsEpisodes: vi.fn(),
    };

    tmdbServiceMock = {
      removeShow: vi.fn(),
      tmdbShows: {
        sync: vi.fn(() => of(undefined)),
      },
    };

    dialogServiceMock = {
      confirm: vi.fn(async () => true),
    };

    seasonServiceMock = {
      getSeasonFromNumber$: vi.fn(() => of(season)),
      addSeason: vi.fn(() => of({ not_found: { shows: [] } })),
      removeSeason: vi.fn(() => of({ not_found: { shows: [] } })),
    };

    const configServiceMock = {
      config: {
        s: signal({
          language: 'en-US',
        }),
      },
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: MatSnackBar, useValue: snackBarMock },
        { provide: TmdbService, useValue: tmdbServiceMock },
        { provide: ShowService, useValue: showServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
        { provide: ListService, useValue: listServiceMock },
        { provide: EpisodeService, useValue: episodeServiceMock },
        { provide: TranslationService, useValue: translationServiceMock },
        { provide: DialogService, useValue: dialogServiceMock },
        { provide: SyncService, useValue: syncServiceMock },
        { provide: SeasonService, useValue: seasonServiceMock },
      ],
    });

    service = TestBed.inject(ExecuteService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('addShow', () => {
    it('should do nothing when show is missing', async () => {
      await service.addShow(undefined);

      expect(showServiceMock.addShowAsSeen).not.toHaveBeenCalled();
    });

    it('should skip when confirm is rejected', async () => {
      dialogServiceMock.confirm.mockResolvedValue(false);

      await service.addShow(show, { showConfirm: true });

      expect(dialogServiceMock.confirm).toHaveBeenCalled();
      expect(showServiceMock.addShowAsSeen).not.toHaveBeenCalled();
    });

    it('should add show and run sync when request succeeds', async () => {
      await service.addShow(show);

      expect(showServiceMock.addShowAsSeen).toHaveBeenCalledWith(show);
      expect(syncServiceMock.syncNew).toHaveBeenCalled();
    });

    it('should report not found and skip sync when trakt add returns missing shows', async () => {
      showServiceMock.addShowAsSeen.mockReturnValueOnce(of({ not_found: { shows: [show] } }));

      await service.addShow(show);

      expect(syncServiceMock.syncNew).not.toHaveBeenCalled();
      expect(snackBarMock.open).toHaveBeenCalledWith('Show(s) not found', 'Reload', {
        duration: 6000,
      });
    });
  });

  describe('removeShow', () => {
    it('should do nothing when show is missing', async () => {
      await service.removeShow(undefined);

      expect(showServiceMock.removeShowAsSeen).not.toHaveBeenCalled();
    });

    it('should skip when confirm is rejected', async () => {
      dialogServiceMock.confirm.mockResolvedValue(false);

      await service.removeShow(show, { showConfirm: true });

      expect(dialogServiceMock.confirm).toHaveBeenCalled();
      expect(showServiceMock.removeShowAsSeen).not.toHaveBeenCalled();
    });

    it('should remove related local show data on success', async () => {
      await service.removeShow(show, { showConfirm: false });

      expect(showServiceMock.removeShowAsSeen).toHaveBeenCalledWith(show);
      expect(showServiceMock.removeShowWatched).toHaveBeenCalledWith(show);
      expect(tmdbServiceMock.removeShow).toHaveBeenCalledWith(77);
      expect(translationServiceMock.removeShowTranslation).toHaveBeenCalledWith(7);
      expect(episodeServiceMock.removeShowsEpisodes).toHaveBeenCalledWith(show);
      expect(translationServiceMock.removeShowsEpisodesTranslation).toHaveBeenCalledWith(show);
      expect(showServiceMock.removeShowProgress).toHaveBeenCalledWith(7);
      expect(showServiceMock.removeFavorite).toHaveBeenCalledWith(show);
    });

    it('should report not found and skip local removals when trakt remove returns missing shows', async () => {
      showServiceMock.removeShowAsSeen.mockReturnValueOnce(of({ not_found: { shows: [show] } }));

      await service.removeShow(show, { showConfirm: false });

      expect(showServiceMock.removeShowWatched).not.toHaveBeenCalled();
      expect(tmdbServiceMock.removeShow).not.toHaveBeenCalled();
      expect(showServiceMock.removeFavorite).not.toHaveBeenCalled();
      expect(snackBarMock.open).toHaveBeenCalledWith('Show(s) not found', 'Reload', {
        duration: 6000,
      });
    });
  });

  describe('addEpisode', () => {
    it('should throw when required args are missing', async () => {
      await expect(service.addEpisode(undefined, show)).rejects.toThrow(
        'Argument is empty (addEpisode)',
      );
    });

    it('should set loading and success states when add succeeds', async () => {
      const state = signal<LoadingState>('loading');
      const setSpy = vi.spyOn(state, 'set');
      const optimisticSpy = vi.fn(async () => undefined);
      (service as unknown as Record<string, unknown>)['addEpisodeOptimistically'] = optimisticSpy;

      await service.addEpisode(episode, show, state);

      expect(optimisticSpy).toHaveBeenCalled();
      expect(setSpy).toHaveBeenCalledWith('loading');
      expect(setSpy).toHaveBeenCalledWith('success');
      expect(episodeServiceMock.addEpisode).toHaveBeenCalledWith(episode);
    });
  });

  describe('removeEpisode', () => {
    it('should throw when required args are missing', () => {
      expect(() => service.removeEpisode(undefined, show)).toThrow(
        'Argument is empty (removeEpisode)',
      );
    });

    it('should call remove endpoint and optimistic updater', () => {
      const state = signal<LoadingState>('loading');
      const optimisticSpy = vi.fn(() => undefined);
      (service as unknown as Record<string, unknown>)['removeEpisodeOptimistically'] =
        optimisticSpy;

      service.removeEpisode(episode, show, state);

      expect(optimisticSpy).toHaveBeenCalledWith(episode, show, state);
      expect(episodeServiceMock.removeEpisode).toHaveBeenCalledWith(episode);
    });
  });

  describe('watchlist actions', () => {
    it('should add to watchlist and sync related data', () => {
      service.addToWatchlist(show);

      expect(listServiceMock.addToWatchlistOptimistically).toHaveBeenCalledWith(show);
      expect(listServiceMock.addToWatchlist).toHaveBeenCalledWith(show);
      expect(listServiceMock.watchlist.sync).toHaveBeenCalled();
      expect(tmdbServiceMock.tmdbShows.sync).toHaveBeenCalledWith(77);
      expect(syncServiceMock.syncShowTranslation).toHaveBeenCalledWith(7, 'en');
      expect(syncServiceMock.syncEpisode).toHaveBeenCalledWith(7, 1, 1, 'en');
    });

    it('should remove from watchlist and clear local data', () => {
      service.removeFromWatchlist(show);

      expect(listServiceMock.removeFromWatchlistOptimistically).toHaveBeenCalledWith(show);
      expect(listServiceMock.removeFromWatchlist).toHaveBeenCalledWith(show);
      expect(tmdbServiceMock.removeShow).toHaveBeenCalledWith(77);
      expect(translationServiceMock.removeShowTranslation).toHaveBeenCalledWith(7);
      expect(episodeServiceMock.removeShowsEpisodes).toHaveBeenCalledWith(show);
      expect(translationServiceMock.removeShowsEpisodesTranslation).toHaveBeenCalledWith(show);
      expect(listServiceMock.watchlist.sync).toHaveBeenCalled();
    });

    it('should report not found and skip sync when adding to watchlist fails with missing shows', () => {
      listServiceMock.addToWatchlist.mockReturnValueOnce(of({ not_found: { shows: [show] } }));

      service.addToWatchlist(show);

      expect(listServiceMock.watchlist.sync).not.toHaveBeenCalled();
      expect(syncServiceMock.syncShowTranslation).not.toHaveBeenCalled();
      expect(snackBarMock.open).toHaveBeenCalledWith('Show(s) not found', 'Reload', {
        duration: 6000,
      });
    });

    it('should report not found and skip local cleanup when removing from watchlist fails', () => {
      listServiceMock.removeFromWatchlist.mockReturnValueOnce(of({ not_found: { shows: [show] } }));

      service.removeFromWatchlist(show);

      expect(tmdbServiceMock.removeShow).not.toHaveBeenCalled();
      expect(translationServiceMock.removeShowTranslation).not.toHaveBeenCalled();
      expect(listServiceMock.watchlist.sync).not.toHaveBeenCalled();
      expect(snackBarMock.open).toHaveBeenCalledWith('Show(s) not found', 'Reload', {
        duration: 6000,
      });
    });
  });

  describe('removeList', () => {
    it('should do nothing when list slug is missing', async () => {
      await service.removeList(undefined);

      expect(listServiceMock.removeList).not.toHaveBeenCalled();
    });

    it('should skip when confirm is rejected', async () => {
      dialogServiceMock.confirm.mockResolvedValue(false);

      await service.removeList('my-list');

      expect(dialogServiceMock.confirm).toHaveBeenCalled();
      expect(listServiceMock.removeList).not.toHaveBeenCalled();
    });

    it('should remove list and resync lists when confirmed', async () => {
      await service.removeList('my-list');

      expect(listServiceMock.removeList).toHaveBeenCalled();
      expect(listServiceMock.lists.sync).toHaveBeenCalledWith({
        force: true,
        publishSingle: true,
      });
    });

    it('should report error when list removal request fails', async () => {
      listServiceMock.removeList.mockReturnValueOnce(throwError(() => new Error('remove failed')));

      await service.removeList('my-list');

      expect(snackBarMock.open).toHaveBeenCalledWith('remove failed', 'Reload', {
        duration: 6000,
      });
    });
  });

  describe('season actions', () => {
    it('should do nothing when season or show is missing on addSeason', async () => {
      await service.addSeason(undefined, show);

      expect(seasonServiceMock.addSeason).not.toHaveBeenCalled();
    });

    it('should skip addSeason when confirm is rejected', async () => {
      dialogServiceMock.confirm.mockResolvedValue(false);

      await service.addSeason(1, show, { showConfirm: true });

      expect(dialogServiceMock.confirm).toHaveBeenCalled();
      expect(seasonServiceMock.addSeason).not.toHaveBeenCalled();
    });

    it('should report missing season when lookup by number returns undefined', async () => {
      seasonServiceMock.getSeasonFromNumber$.mockReturnValueOnce(of(undefined));

      await service.addSeason(999, show, { showConfirm: false });

      expect(seasonServiceMock.addSeason).not.toHaveBeenCalled();
      expect(snackBarMock.open).toHaveBeenCalledWith('Season does not exist', 'Reload', {
        duration: 6000,
      });
    });

    it('should add season from number and sync', async () => {
      await service.addSeason(1, show, { showConfirm: false });

      expect(seasonServiceMock.getSeasonFromNumber$).toHaveBeenCalledWith(1, show);
      expect(seasonServiceMock.addSeason).toHaveBeenCalledWith(season);
      expect(syncServiceMock.syncNew).toHaveBeenCalled();
    });

    it('should do nothing when season or show is missing on removeSeason', async () => {
      await service.removeSeason(undefined, show);

      expect(seasonServiceMock.removeSeason).not.toHaveBeenCalled();
    });

    it('should skip removeSeason when confirm is rejected', async () => {
      dialogServiceMock.confirm.mockResolvedValue(false);

      await service.removeSeason(season, show, { showConfirm: true });

      expect(dialogServiceMock.confirm).toHaveBeenCalled();
      expect(seasonServiceMock.removeSeason).not.toHaveBeenCalled();
    });

    it('should remove season and sync when confirmed', async () => {
      await service.removeSeason(season, show, { showConfirm: false });

      expect(seasonServiceMock.removeSeason).toHaveBeenCalledWith(season);
      expect(syncServiceMock.syncNew).toHaveBeenCalled();
    });
  });

  describe('hidden show actions', () => {
    it('should add hidden show optimistically and call API', async () => {
      await service.addShowHidden(show);

      expect(showServiceMock.updateShowsHidden).toHaveBeenCalled();
      expect(showServiceMock.addShowHidden).toHaveBeenCalledWith(show);
    });

    it('should remove hidden show optimistically and call API', async () => {
      showServiceMock.showsHidden.s.set([
        {
          show: {
            ids: {
              trakt: 7,
            },
          },
        },
      ]);

      await service.removeShowHidden(show);

      expect(showServiceMock.updateShowsHidden).toHaveBeenCalledWith([]);
      expect(showServiceMock.removeShowHidden).toHaveBeenCalledWith(show);
    });
  });

  describe('refreshShow', () => {
    it('should refresh show data and open success snackbar', () => {
      service.refreshShow(show);

      expect(showServiceMock.showsProgress.sync).toHaveBeenCalledWith(7, { force: true });
      expect(tmdbServiceMock.tmdbShows.sync).toHaveBeenCalled();
      expect(syncServiceMock.syncShowTranslation).toHaveBeenCalledWith(7, 'en', { force: true });
      expect(snackBarMock.open).toHaveBeenCalledWith('Show refreshed', undefined, {
        duration: 2000,
      });
    });

    it('should handle refresh errors without throwing', () => {
      showServiceMock.showsProgress.sync.mockReturnValueOnce(throwError(() => new Error('nope')));

      expect(() => service.refreshShow(show)).not.toThrow();
    });
  });
});

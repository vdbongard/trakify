import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom, Observable } from 'rxjs';
import { fetchParsed } from '@helper/fetchParsed';
import { ListService } from '../../lists/data/list.service';
import { TranslationService } from './translation.service';
import { TRAKT_PAGE_SIZE } from '@constants';
import { translated } from '@helper/translation';
import { markEpisodeWatched, unmarkEpisodeWatched } from '@helper/episodes';
import { isNextEpisodeOrLater } from '@helper/shows';
import { requestPagesUntilEmpty } from '@helper/requestPagesUntilEmpty';
import { sum } from '@helper/sum';
import { isFuture } from 'date-fns';
import { rateLimit } from '@operator/rateLimit';
import { LocalStorage } from '@type/Enum';
import {
  AnticipatedShow,
  anticipatedShowSchema,
  Episode,
  EpisodeFull,
  EpisodeProgress,
  Period,
  RecommendedShow,
  recommendedShowSchema,
  SeasonProgress,
  Show,
  ShowHidden,
  ShowPeople,
  showPeopleSchema,
  showHiddenSchema,
  ShowProgress,
  showProgressSchema,
  ShowProgressOverview,
  showProgressOverviewSchema,
  showSchema,
  ShowSearch,
  showSearchSchema,
  ShowWatched,
  ShowWatchedOrPlayedAll,
  showWatchedOrPlayedAllSchema,
  showWatchedSchema,
  TrendingShow,
  trendingShowSchema,
} from '@type/Trakt';
import type {
  AddToHistoryResponse,
  AddToUsersResponse,
  RemoveFromHistoryResponse,
  RemoveFromUsersResponse,
} from '@type/TraktResponse';
import { parseResponse } from '@operator/parseResponse';
import { API } from '@shared/api';
import { toUrl } from '@helper/toUrl';
import { LocalStorageService } from '@services/local-storage.service';
import { SyncDataService } from '@services/sync-data.service';

@Injectable({
  providedIn: 'root',
})
export class ShowService {
  http = inject(HttpClient);
  listService = inject(ListService);
  translationService = inject(TranslationService);
  localStorageService = inject(LocalStorageService);
  syncDataService = inject(SyncDataService);

  activeShow = signal<Show | undefined>(undefined);

  constructor() {
    this.migrateLegacyProgressOverview();
  }

  /**
   * One-time migration from the pre-unification split stores: entries that only exist
   * under the legacy overview key move into the unified Show Progress map (common
   * fields, no `seasons`), then the legacy key is dropped.
   */
  private migrateLegacyProgressOverview(): void {
    const legacy = this.localStorageService.getObject<Record<string, ShowProgress>>(
      LocalStorage.SHOWS_PROGRESS_OVERVIEW,
    );
    if (legacy) {
      const showsProgress = this.showsProgress.s();
      let isChanged = false;
      for (const [showId, progress] of Object.entries(legacy)) {
        if (!progress || showsProgress[showId]) continue;
        showsProgress[showId] = { ...progress };
        isChanged = true;
      }
      if (isChanged) this.updateShowsProgress({ ...showsProgress });
    }
    localStorage.removeItem(LocalStorage.SHOWS_PROGRESS_OVERVIEW);
  }

  /**
   * Bulk Sync of every show's progress (ADR-0003): pages the compact endpoint and
   * merges the common fields into the unified map, preserving lazily-fetched
   * seasonal detail (`seasons`) that the bulk response does not carry. Entries the
   * bulk response does not contain are left alone; orphan eviction stays explicit.
   */
  async syncShowsProgress(): Promise<void> {
    const overviews = await lastValueFrom(
      requestPagesUntilEmpty<ShowProgressOverview>((page) =>
        this.http
          .get<ShowProgressOverview[]>(toUrl(API.syncProgressShows, [page, TRAKT_PAGE_SIZE]))
          .pipe(parseResponse(showProgressOverviewSchema.array()), rateLimit()),
      ),
    );
    const merged: Record<string, ShowProgress | undefined> = { ...this.showsProgress.s() };
    for (const overview of overviews) {
      const showId = String(overview.show.ids.trakt);
      const seasons = merged[showId]?.seasons;
      merged[showId] = {
        ...overview.progress,
        last_watched_at: overview.progress.last_watched_at ?? null,
        ...(seasons ? { seasons } : {}),
      };
    }
    this.updateShowsProgress(merged);
  }

  showsWatched = this.syncDataService.syncArrayPaged<ShowWatched>({
    url: API.syncWatchedShows,
    localStorageKey: LocalStorage.SHOWS_WATCHED,
    schema: showWatchedSchema.array(),
    pageSize: TRAKT_PAGE_SIZE,
  });
  showsProgress = this.syncDataService.syncObjects<ShowProgress>({
    url: API.showProgress,
    localStorageKey: LocalStorage.SHOWS_PROGRESS,
    schema: showProgressSchema,
    ignoreExisting: true,
  });
  showsHidden = this.syncDataService.syncArrayPaged<ShowHidden>({
    url: API.showsHidden,
    localStorageKey: LocalStorage.SHOWS_HIDDEN,
    schema: showHiddenSchema.array(),
    pageSize: TRAKT_PAGE_SIZE,
  });
  favorites = this.syncDataService.syncArray<number>({
    localStorageKey: LocalStorage.FAVORITES,
  });

  fetchShow(showId: number | string): Promise<Show> {
    return fetchParsed(this.http.get<Show>(toUrl(API.show, [showId])), showSchema);
  }

  fetchShowPeople(showId: number): Promise<ShowPeople> {
    return fetchParsed(
      this.http.get<ShowPeople>(toUrl(API.showPeople, [showId])),
      showPeopleSchema,
    );
  }

  fetchSearchForShows(query: string, page: number, limit: number): Promise<ShowSearch[]> {
    return fetchParsed(
      this.http.get<ShowSearch[]>(toUrl(API.showSearch, [query, page, limit])),
      showSearchSchema.array(),
    );
  }

  fetchTrendingShows(): Promise<TrendingShow[]> {
    return fetchParsed(
      this.http.get<TrendingShow[]>(API.showsTrending),
      trendingShowSchema.array(),
    );
  }

  fetchPopularShows(): Promise<Show[]> {
    return fetchParsed(this.http.get<Show[]>(API.showsPopular), showSchema.array());
  }

  fetchRecommendedShows(): Promise<RecommendedShow[]> {
    return fetchParsed(
      this.http.get<RecommendedShow[]>(API.showsRecommended),
      recommendedShowSchema.array(),
    );
  }

  fetchAnticipatedShows(): Promise<AnticipatedShow[]> {
    return fetchParsed(
      this.http.get<AnticipatedShow[]>(API.showsAnticipated),
      anticipatedShowSchema.array(),
    );
  }

  fetchWatchedShows(period: Period): Promise<ShowWatchedOrPlayedAll[]> {
    return fetchParsed(
      this.http.get<ShowWatchedOrPlayedAll[]>(toUrl(API.showsWatched, [period])),
      showWatchedOrPlayedAllSchema.array(),
    );
  }

  fetchPlayedShows(period: Period): Promise<ShowWatchedOrPlayedAll[]> {
    return fetchParsed(
      this.http.get<ShowWatchedOrPlayedAll[]>(toUrl(API.showsPlayed, [period])),
      showWatchedOrPlayedAllSchema.array(),
    );
  }

  addShowAsSeen(show: Show): Observable<AddToHistoryResponse> {
    return this.http.post<AddToHistoryResponse>(API.syncHistory, {
      shows: [show],
    });
  }

  removeShowAsSeen(show: Show): Observable<RemoveFromHistoryResponse> {
    return this.http.post<RemoveFromHistoryResponse>(API.syncHistoryRemove, {
      shows: [show],
    });
  }

  addShowHidden(show: Show): Observable<AddToUsersResponse> {
    return this.http.post<AddToUsersResponse>(API.showAddHidden, {
      shows: [show],
    });
  }

  removeShowHidden(show: Show): Observable<RemoveFromUsersResponse> {
    return this.http.post<RemoveFromUsersResponse>(API.showRemoveHidden, {
      shows: [show],
    });
  }

  isFavorite(show?: Show, favorites = this.favorites.s()): boolean {
    return !!show && favorites?.includes(show.ids.trakt);
  }

  isHidden(show?: Show): boolean {
    const showsHidden = this.showsHidden.s();
    return (
      !!show && showsHidden?.map((showHidden) => showHidden.show.ids.trakt).includes(show.ids.trakt)
    );
  }

  addFavorite(show?: Show | null): void {
    if (!show) return;
    const favorites = this.favorites.s();
    if (!favorites) {
      this.favorites.s.set([show.ids.trakt]);
      this.localStorageService.setObject<number[]>(LocalStorage.FAVORITES, this.favorites.s());
      return;
    }
    if (favorites.includes(show.ids.trakt)) return;
    favorites.push(show.ids.trakt);
    this.favorites.sync();
  }

  removeFavorite(show?: Show | null): void {
    if (!show) return;
    let favorites = this.favorites.s();
    if (!favorites?.includes(show.ids.trakt)) return;
    favorites = favorites.filter((favorite) => favorite !== show.ids.trakt);
    this.favorites.s.set([...(favorites ?? [])]);
    this.favorites.sync({ deferPublish: true });
  }

  showsWatchedTranslated = computed(() => {
    const showsWatched = this.showsWatched.s();
    const showsTranslations = this.translationService.showsTranslations.s();

    return (
      showsWatched?.map((showWatched) => ({
        ...showWatched,
        show: {
          ...showWatched.show,
          title: showsTranslations[showWatched.show.ids.trakt]?.title ?? showWatched.show.title,
        },
      })) ?? []
    );
  });

  shows = computed(() => [
    ...(this.showsWatched.s()?.map((showWatched) => showWatched.show) ?? []),
    ...(this.listService.watchlist.s()?.map((watchlistItem) => watchlistItem.show) ?? []),
  ]);

  showsTranslated = computed(() => {
    const showsTranslations = this.translationService.showsTranslations.s();
    return this.shows().map((show) => translated(show, showsTranslations[show.ids.trakt]));
  });

  async syncShowProgress(showIdTrakt: number): Promise<ShowProgress | undefined> {
    await this.showsProgress.fetchIds([showIdTrakt], { persist: true });
    this.updateShowsProgress();
    return this.showsProgress.s()[showIdTrakt];
  }

  searchForAddedShows(query: string): Show[] {
    const queryLowerCase = query.toLowerCase();
    const showsSearched = this.showsTranslated().filter((show) =>
      show.title.toLowerCase().includes(queryLowerCase),
    );
    showsSearched.sort((a, b) =>
      a.title.toLowerCase().startsWith(queryLowerCase) &&
      !b.title.toLowerCase().startsWith(queryLowerCase)
        ? -1
        : 1,
    );
    return showsSearched;
  }

  removeShowProgress(showIdTrakt: number): void {
    const showsProgress = this.showsProgress.s();
    if (!showsProgress[showIdTrakt]) return;

    console.debug('removing show progress:', showIdTrakt, showsProgress[showIdTrakt]);
    delete showsProgress[showIdTrakt];
    this.showsProgress.s.set({ ...showsProgress });
    this.localStorageService.setObject(LocalStorage.SHOWS_PROGRESS, showsProgress);
  }

  getShowWatchedIndex(show: Show): number {
    const showsWatched = this.showsWatched.s();
    if (!showsWatched) throw Error('Shows watched empty');

    return showsWatched?.findIndex((showWatched) => showWatched.show.ids.trakt === show.ids.trakt);
  }

  moveShowWatchedToFront(showWatchedIndex: number): void {
    const showsWatched = this.showsWatched.s();
    if (!showsWatched) throw Error('Shows watched empty');
    showsWatched.unshift(showsWatched.splice(showWatchedIndex, 1)[0]);
    this.updateShowsWatched(showsWatched);
  }

  updateShowsWatched(showsWatched: ShowWatched[]): void {
    this.showsWatched.s.set([...showsWatched]);
    this.localStorageService.setObject(LocalStorage.SHOWS_WATCHED, showsWatched);
  }

  getShowProgress(show: Show): ShowProgress | undefined {
    const showsProgress = this.showsProgress.s();
    if (!showsProgress) throw Error('Shows progress empty');

    return showsProgress[show.ids.trakt];
  }

  updateShowsProgress(showsProgress = this.showsProgress.s(), options = { save: true }): void {
    this.showsProgress.s.set({ ...showsProgress });
    if (options.save) {
      this.localStorageService.setObject(LocalStorage.SHOWS_PROGRESS, showsProgress);
    }
  }

  /**
   * Optimistically marks an episode seen in the unified Show Progress map: advances the
   * common fields (`completed`, `next_episode`) and patches the seasonal detail when it
   * is present. Returns whether the watched episode was the current Next Episode, i.e.
   * whether the caller still has to converge the following episode (TMDB lookahead).
   */
  markEpisodeSeen(show: Show, episode: Episode): boolean {
    const progress = this.showsProgress.s()[show.ids.trakt];
    if (!progress) return false;

    const advanceNeeded = isNextEpisodeOrLater(progress, episode);
    markEpisodeWatched(progress, episode);

    const seasonProgress = progress.seasons?.find((season) => season.number === episode.season);
    if (seasonProgress) {
      seasonProgress.completed++;
      if (seasonProgress.completed > seasonProgress.aired)
        seasonProgress.aired = seasonProgress.completed;

      const now = new Date().toISOString();
      const episodeProgress = seasonProgress.episodes.find((e) => e.number === episode.number);
      if (episodeProgress) {
        episodeProgress.completed = true;
        episodeProgress.last_watched_at = now;
      } else {
        seasonProgress.episodes.push({
          number: episode.number,
          completed: true,
          last_watched_at: now,
        });
      }
    }

    // a temporarily undefined next_episode is not persisted (JSON.stringify drops the key)
    this.updateShowsProgress(this.showsProgress.s(), {
      save: progress.next_episode !== undefined,
    });
    return advanceNeeded;
  }

  /** Optimistically un-marks an episode seen; restores the Next Episode when applicable. */
  unmarkEpisodeSeen(show: Show, episode: Episode): void {
    const progress = this.showsProgress.s()[show.ids.trakt];
    if (!progress) return;

    const seasonProgress = progress.seasons?.find((season) => season.number === episode.season);
    if (seasonProgress) {
      seasonProgress.completed = Math.max(seasonProgress.completed - 1, 0);

      const episodeProgress = seasonProgress.episodes.find((e) => e.number === episode.number);
      if (episodeProgress) episodeProgress.completed = false;
    }

    unmarkEpisodeWatched(progress, episode);
    this.updateShowsProgress();
  }

  /** Converges the Next Episode to "no further episodes" (end of show). */
  clearNextEpisode(show: Show): void {
    const progress = this.showsProgress.s()[show.ids.trakt];
    if (!progress) return;
    progress.next_episode = null;
    this.updateShowsProgress();
  }

  /**
   * Backfills aired entries for episodes the detail store does not know yet (called
   * after Sync with the episode store; previously lived in the episode data module).
   */
  reconcileAiredEntries(showsEpisodes: Record<string, EpisodeFull | undefined>): void {
    let isChanged = false;

    const showProgressEntries = Object.entries(this.showsProgress.s()).map(
      ([showId, showProgress]) => {
        if (!showProgress) return [showId, showProgress];

        const nextEpisode = Object.entries(showsEpisodes).find(([episodeId]) =>
          episodeId.startsWith(showId + '-'),
        );

        if (!nextEpisode?.[1]?.first_aired || isFuture(new Date(nextEpisode[1].first_aired)))
          return [showId, showProgress];

        showProgress.seasons ??= [];

        // check if show progress is already existing
        const seasonProgress = showProgress.seasons.find(
          (season) => season.number === nextEpisode[1]!.season,
        );
        const episodeProgress = seasonProgress?.episodes.find(
          (episode) => episode.number === nextEpisode[1]!.number,
        );
        if (episodeProgress) return [showId, showProgress];

        // otherwise push new one and update aired values for season and show
        const episodeProgressNew: EpisodeProgress = {
          number: nextEpisode[1]!.number,
          completed: false,
          last_watched_at: null,
        };

        if (!seasonProgress) {
          const seasonProgressNew: SeasonProgress = {
            aired: 1,
            completed: 0,
            episodes: [episodeProgressNew],
            number: nextEpisode[1]?.season,
            title: null,
          };
          showProgress.seasons.push(seasonProgressNew);
        } else {
          seasonProgress.episodes.push(episodeProgressNew);
          seasonProgress.aired = seasonProgress.episodes.length;
        }

        showProgress.aired = sum(
          showProgress.seasons
            .filter((season) => season.number !== 0)
            .map((season) => season.aired),
        );

        isChanged = true;

        return [showId, showProgress];
      },
    );

    if (isChanged) {
      this.updateShowsProgress(Object.fromEntries(showProgressEntries));
    }
  }

  removeShowWatched(show: Show): void {
    const showsWatched = this.showsWatched.s();
    if (!showsWatched) return;

    const showWatchedIndex = showsWatched.findIndex(
      (showWatched) => showWatched.show.ids.trakt === show.ids.trakt,
    );
    if (showWatchedIndex === -1) return;

    console.debug('removing show watched:', show.ids.trakt, showsWatched[showWatchedIndex]);
    showsWatched.splice(showWatchedIndex, 1);
    this.showsWatched.s.set([...(showsWatched ?? [])]);
    this.localStorageService.setObject(LocalStorage.SHOWS_WATCHED, showsWatched);
  }

  updateShowsHidden(showsHidden = this.showsHidden.s()): void {
    this.showsHidden.s.set([...(showsHidden ?? [])]);
    this.localStorageService.setObject(LocalStorage.SHOWS_HIDDEN, showsHidden);
  }
}

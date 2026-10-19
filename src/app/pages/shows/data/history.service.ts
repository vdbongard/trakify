import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { z } from 'zod';
import { API } from '@shared/api';
import { HISTORY_PAGE_SIZE } from '@constants';
import { fetchParsed } from '@helper/fetchParsed';
import { uniqueEpisodePlays } from '@helper/history';
import { toUrl } from '@helper/toUrl';
import { wait } from '@helper/wait';
import { queryKeys } from '@shared/query-keys';
import { TmdbService } from './tmdb.service';
import { TranslationService } from './translation.service';
import type { TmdbEpisode } from '@type/Tmdb';
import { historyPlaySchema, HistoryPlay } from '@type/Trakt';

type PlaysQueryKey = ReturnType<typeof queryKeys.history>;
type PlayArtworkQueryKey = ReturnType<typeof queryKeys.historyTmdbEpisode>;

/** What the History's Plays query options look like, so the component and the route that warms the
 *  cache ahead of arriving can build the same query. */
interface PlaysQueryOptions {
  queryKey: PlaysQueryKey;
  queryFn: (context: { pageParam: number }) => Promise<HistoryPlay[]>;
  initialPageParam: number;
  getNextPageParam: (
    lastPage: HistoryPlay[],
    pages: HistoryPlay[][],
    lastPageParam: number,
  ) => number | undefined;
}

/** What a Play's artwork query options look like, shared the same way. */
interface PlayArtworkQueryOptions {
  queryKey: PlayArtworkQueryKey;
  queryFn: () => Promise<TmdbEpisode | null>;
}

/**
 * How long a navigation may be held while the History's first page is warmed for it. Past this a
 * spinner is a better answer than a frozen view.
 */
const WARM_TIMEOUT_MS = 500;

/**
 * Reads the User's Trakt History on demand. History is deliberately not a mirrored store: it is
 * unbounded (one entry per Play) and only ever rendered one screen at a time, so the component
 * pages through it instead of syncing it into local storage.
 */
@Injectable({
  providedIn: 'root',
})
export class HistoryService {
  http = inject(HttpClient);
  queryClient = inject(QueryClient);
  tmdbService = inject(TmdbService);
  translationService = inject(TranslationService);

  fetchPlays(page: number): Promise<HistoryPlay[]> {
    return fetchParsed(
      this.http.get<HistoryPlay[]>(toUrl(API.historyEpisodes, [page, HISTORY_PAGE_SIZE])),
      z.array(historyPlaySchema),
    );
  }

  /** The paged Plays the History renders. Also read by the route that warms them ahead of arriving,
   *  which has to build the same query. */
  playsQueryOptions(): PlaysQueryOptions {
    return {
      queryKey: queryKeys.history(),
      queryFn: ({ pageParam }): Promise<HistoryPlay[]> =>
        this.fetchPlaysWithTranslations(pageParam),
      initialPageParam: 1,
      getNextPageParam: (lastPage, _pages, lastPageParam): number | undefined =>
        lastPage.length === HISTORY_PAGE_SIZE ? lastPageParam + 1 : undefined,
    };
  }

  /**
   * Reads a page of Plays and makes sure the Show and Episode translations its rows render are in
   * the store before the page resolves. The rows read those titles from the store, so fetching
   * them here — one request per Show or Episode, not per Play — stops a row from first painting the
   * original title and swapping it a beat later, while the row's own queries run behind it.
   */
  private async fetchPlaysWithTranslations(page: number): Promise<HistoryPlay[]> {
    const plays = await this.fetchPlays(page);
    await this.ensurePlaysTranslations(plays);
    return plays;
  }

  /** Warms the translation store for a page's Shows and Episodes, best effort per item. */
  private async ensurePlaysTranslations(plays: HistoryPlay[]): Promise<void> {
    await Promise.all([
      this.translationService.ensureShowsTranslations(
        plays.map((play) => play.show),
        { persist: true },
      ),
      this.translationService.ensureEpisodesTranslations(
        plays.map((play) => ({
          show: play.show,
          season: play.episode.season,
          episode: play.episode.number,
        })),
        { persist: true },
      ),
    ]);
  }

  /** A Play's artwork: the TMDB Episode behind one request, whose title translation is fetched
   *  alongside it. Keyed by Episode, not by Play, so a rewatch asks for it once. */
  episodeQueryOptions(play: HistoryPlay, language: string): PlayArtworkQueryOptions {
    return {
      queryKey: queryKeys.historyTmdbEpisode(
        play.show.ids.tmdb ?? null,
        play.episode.season,
        play.episode.number,
        language,
      ),
      queryFn: (): Promise<TmdbEpisode | null> => this.fetchEpisode(play),
    };
  }

  /**
   * Loads the History's first page, and the artwork its rows need, for a navigation that has to
   * render them in its first pass: a view transition into the page needs the row on screen — and
   * named — when the browser captures the new view.
   *
   * Best effort, so it resolves without failing: a History that cannot be read shows its own error
   * rather than failing the navigation. Bounded, so a slow network gets the loading spinner instead
   * of a view that stops responding to the tap that asked for it.
   */
  async warmFirstPage(language: string): Promise<void> {
    await Promise.race([this.loadFirstPage(language), wait(WARM_TIMEOUT_MS)]).catch(
      () => undefined,
    );
  }

  private async loadFirstPage(language: string): Promise<void> {
    const plays = await this.queryClient.ensureInfiniteQueryData(this.playsQueryOptions());

    await Promise.all(
      uniqueEpisodePlays(plays.pages[0] ?? []).map((play) =>
        this.queryClient.ensureQueryData(this.episodeQueryOptions(play, language)),
      ),
    );
  }

  /**
   * A Play's artwork. The Episode title translation rides along with the still: the page's own
   * fetch usually warmed it already (see `ensurePlaysTranslations`), so this is generally a cache
   * hit, but it keeps the row translated when a page arrives without that warm-up.
   */
  private async fetchEpisode(play: HistoryPlay): Promise<TmdbEpisode | null> {
    const { show, episode } = play;
    await this.translationService
      .ensureEpisodeTranslation(show, episode.season, episode.number, { persist: true })
      .catch(() => undefined);
    return this.tmdbService
      .fetchTmdbEpisode(show, episode.season, episode.number, { persist: true })
      .catch(() => null);
  }
}

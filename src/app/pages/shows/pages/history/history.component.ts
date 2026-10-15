import { Component, computed, effect, ElementRef, inject, viewChild } from '@angular/core';
import { injectInfiniteQuery } from '@tanstack/angular-query-experimental';
import { injectQueries } from '@tanstack/angular-query-experimental/inject-queries-experimental';
import { MatListModule } from '@angular/material/list';
import { Router, RouterLink } from '@angular/router';
import { HistoryService } from '../../data/history.service';
import { TmdbService } from '../../data/tmdb.service';
import { TranslationService } from '../../data/translation.service';
import { ConfigService } from '@services/config.service';
import { SpinnerComponent } from '@shared/components/spinner/spinner.component';
import { ErrorText } from '@shared/components/error-text/error-text.component';
import { HistoryItemComponent } from './ui/history-item/history-item.component';
import { getShowSlug } from '@helper/getShowSlug';
import { groupHistoryByDay } from '@helper/history';
import { toEpisodeId } from '@helper/toShowId';
import { dedupeByKey } from '@helper/dedupeByKey';
import { HISTORY_PAGE_SIZE } from '@constants';
import { queryKeys } from '@shared/query-keys';
import type { HistoryPlay } from '@type/Trakt';
import type { TmdbEpisode, TmdbShow } from '@type/Tmdb';

@Component({
  selector: 't-history',
  imports: [MatListModule, RouterLink, SpinnerComponent, ErrorText, HistoryItemComponent],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
})
export default class HistoryComponent {
  historyService = inject(HistoryService);
  tmdbService = inject(TmdbService);
  translationService = inject(TranslationService);
  configService = inject(ConfigService);
  router = inject(Router);

  pageSentinel = viewChild<ElementRef<HTMLElement>>('pageSentinel');

  playsQuery = injectInfiniteQuery(() => ({
    queryKey: queryKeys.history(),
    queryFn: ({ pageParam }): Promise<HistoryPlay[]> => this.historyService.fetchPlays(pageParam),
    initialPageParam: 1,
    getNextPageParam: (
      lastPage: HistoryPlay[],
      _pages: HistoryPlay[][],
      lastPageParam: number,
    ): number | undefined =>
      lastPage.length === HISTORY_PAGE_SIZE ? lastPageParam + 1 : undefined,
  }));

  plays = computed<HistoryPlay[]>(() => this.playsQuery.data()?.pages.flat() ?? []);
  groups = computed(() => groupHistoryByDay(this.plays()));
  isPending = computed(() => this.playsQuery.isPending());
  error = computed<Error | null>(() =>
    this.playsQuery.isError() ? new Error('Failed to load history.') : null,
  );

  /** Position of each Play in the whole, newest-first History (drives image preloading). */
  private indexByPlayId = computed(
    () => new Map(this.plays().map((play, index) => [play.id, index])),
  );

  /**
   * Shows and Episodes the visible Plays need artwork for — one TMDB query each, never one per
   * Play, and only for entries with a TMDB id (a key without one would collide across Shows).
   */
  private uniqueShows = computed(() =>
    dedupeByKey(
      this.plays()
        .map((play) => play.show)
        .filter((show) => show.ids.tmdb != null),
      (show) => show.ids.trakt,
    ),
  );
  private uniqueEpisodes = computed(() =>
    dedupeByKey(
      this.plays().filter((play) => play.show.ids.tmdb != null),
      (play) => playKey(play),
    ),
  );

  private showQueries = injectQueries(() => ({
    queries: this.uniqueShows().map((show) => ({
      queryKey: queryKeys.tmdbShow(show.ids.tmdb ?? null, this.language()),
      queryFn: (): Promise<TmdbShow> => this.tmdbService.fetchTmdbShowEntry(show),
    })),
  }));

  private episodeQueries = injectQueries(() => ({
    queries: this.uniqueEpisodes().map((play) => ({
      queryKey: queryKeys.historyTmdbEpisode(
        play.show.ids.tmdb ?? null,
        play.episode.season,
        play.episode.number,
        this.language(),
      ),
      queryFn: (): Promise<TmdbEpisode | null> => this.fetchEpisode(play),
    })),
  }));

  private tmdbShowsByTraktId = computed(() => {
    const results = this.showQueries();
    return new Map(
      this.uniqueShows().map((show, index) => [show.ids.trakt, results[index]?.data()] as const),
    );
  });

  private tmdbEpisodesByKey = computed(() => {
    const results = this.episodeQueries();
    return new Map(
      this.uniqueEpisodes().map((play, index) => [playKey(play), results[index]?.data()] as const),
    );
  });

  constructor() {
    effect((onCleanup) => {
      const sentinel = this.pageSentinel()?.nativeElement;
      if (!sentinel || typeof IntersectionObserver === 'undefined') return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) void this.loadNextPage();
        },
        { rootMargin: '0px 0px 200px 0px' },
      );
      observer.observe(sentinel);
      onCleanup(() => observer.disconnect());
    });
  }

  tmdbShowFor(play: HistoryPlay): TmdbShow | undefined {
    return this.tmdbShowsByTraktId().get(play.show.ids.trakt);
  }

  episodeLink(play: HistoryPlay): string {
    const { show, episode } = play;
    return `/shows/s/${getShowSlug(show)}/season/${episode.season}/episode/${episode.number}`;
  }

  playIndex(play: HistoryPlay): number | undefined {
    return this.indexByPlayId().get(play.id);
  }

  tmdbEpisodeFor(play: HistoryPlay): TmdbEpisode | null | undefined {
    return this.tmdbEpisodesByKey().get(playKey(play));
  }

  async loadNextPage(): Promise<void> {
    if (!this.playsQuery.hasNextPage() || this.playsQuery.isFetchingNextPage()) return;

    // A failed later page leaves the Plays already on screen in place — error() only covers a
    // history that never loaded.
    await this.playsQuery.fetchNextPage().catch(() => undefined);
  }

  private language(): string {
    return this.configService.config.s().language;
  }

  /** A Play's Episode title translation is fetched alongside its TMDB still. */
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

function playKey(play: HistoryPlay): string {
  return toEpisodeId(play.show.ids.trakt, play.episode.season, play.episode.number);
}

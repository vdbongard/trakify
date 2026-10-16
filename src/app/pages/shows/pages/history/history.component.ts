import {
  afterNextRender,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  viewChild,
  viewChildren,
} from '@angular/core';
import { injectInfiniteQuery } from '@tanstack/angular-query-experimental';
import { injectQueries } from '@tanstack/angular-query-experimental/inject-queries-experimental';
import { MatListModule } from '@angular/material/list';
import { Router, RouterLink } from '@angular/router';
import { HistoryService } from '../../data/history.service';
import { TmdbService } from '../../data/tmdb.service';
import { ConfigService } from '@services/config.service';
import { SpinnerComponent } from '@shared/components/spinner/spinner.component';
import { ErrorText } from '@shared/components/error-text/error-text.component';
import { HistoryItemComponent } from './ui/history-item/history-item.component';
import { getShowSlug } from '@helper/getShowSlug';
import { groupHistoryByDay, playForEpisodeUrl, playKey, uniqueEpisodePlays } from '@helper/history';
import { dedupeByKey } from '@helper/dedupeByKey';
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
  configService = inject(ConfigService);
  router = inject(Router);

  pageSentinel = viewChild<ElementRef<HTMLElement>>('pageSentinel');

  playsQuery = injectInfiniteQuery(() => this.historyService.playsQueryOptions());

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

  /** The row named for the navigation in flight, so its name can be taken off it again first. */
  private namedRow?: HistoryItemComponent;

  private rows = viewChildren(HistoryItemComponent);

  /** The URL the arriving navigation left, read before the router clears that navigation. */
  private previousUrl = this.router.currentNavigation()?.previousNavigation?.finalUrl?.toString();

  /** Shows the visible Plays need artwork for — one TMDB query each, never one per Play. */
  private uniqueShows = computed(() =>
    dedupeByKey(
      this.plays()
        .map((play) => play.show)
        .filter((show) => show.ids.tmdb != null),
      (show) => show.ids.trakt,
    ),
  );

  /** The Plays whose Episode stills the rows show, one TMDB query each. */
  private uniqueEpisodes = computed(() => uniqueEpisodePlays(this.plays()));

  private showQueries = injectQueries(() => ({
    queries: this.uniqueShows().map((show) => ({
      queryKey: queryKeys.tmdbShow(show.ids.tmdb ?? null, this.language()),
      queryFn: (): Promise<TmdbShow> => this.tmdbService.fetchTmdbShowEntry(show),
    })),
  }));

  private episodeQueries = injectQueries(() => ({
    queries: this.uniqueEpisodes().map((play) =>
      this.historyService.episodeQueryOptions(play, this.language()),
    ),
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

  readonly _observePageSentinel = effect((onCleanup) => {
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

  constructor() {
    // The name has to be on the row by the time the browser captures the new view of a transition
    // into this page, which is the render after this one.
    afterNextRender(() => this.nameRowReturnedFrom());
  }

  tmdbShowFor(play: HistoryPlay): TmdbShow | undefined {
    return this.tmdbShowsByTraktId().get(play.show.ids.trakt);
  }

  episodeLink(play: HistoryPlay): string {
    const { show, episode } = play;
    return `/shows/s/${getShowSlug(show)}/season/${episode.season}/episode/${episode.number}`;
  }

  /** Names the row's artwork for the view transition to the Episode page. Runs on the click, before
   *  the router starts the navigation, so the row is already named when the old view is captured. */
  prepareViewTransition(row: HistoryItemComponent): void {
    this.namedRow?.clearViewTransition();
    this.namedRow = row;
    row.prepareViewTransition();
  }

  /** Names the row a navigation came back from, so its artwork morphs out of the Episode still.
   *
   *  A back navigation carries no Episode: the History entry keeps the state it was pushed with, so
   *  the URL that was left is what says which Episode the reader came from. */
  private nameRowReturnedFrom(): void {
    const url = this.previousUrl;
    if (!url) return;

    const play = playForEpisodeUrl(this.plays(), url);
    const row = play && this.rows().find((row) => row.play().id === play.id);
    if (row) this.prepareViewTransition(row);
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
}

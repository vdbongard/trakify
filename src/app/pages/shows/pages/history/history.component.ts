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
import { injectInfiniteQuery, injectQueries } from '@tanstack/angular-query';
import { MatListModule } from '@angular/material/list';
import { MatRippleModule } from '@angular/material/core';
import { HideRippleOnScrollDirective } from '@shared/directives/hide-ripple-on-scroll.directive';
import { Router, RouterLink } from '@angular/router';
import { HistoryService } from '../../data/history.service';
import { TmdbService } from '../../data/tmdb.service';
import { ConfigService } from '@services/config.service';
import { ViewTransitionService } from '@services/view-transition.service';
import { QueryErrorNoticeService } from '@services/query-error-notice.service';
import { noticeRefreshErrors } from '@helper/queryErrorNotice';
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
  imports: [
    MatListModule,
    MatRippleModule,
    HideRippleOnScrollDirective,
    RouterLink,
    SpinnerComponent,
    ErrorText,
    HistoryItemComponent,
  ],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
  providers: [QueryErrorNoticeService],
})
export default class HistoryComponent {
  historyService = inject(HistoryService);
  tmdbService = inject(TmdbService);
  configService = inject(ConfigService);
  router = inject(Router);
  viewTransition = inject(ViewTransitionService);
  queryErrorNotice = inject(QueryErrorNoticeService);

  pageSentinel = viewChild<ElementRef<HTMLElement>>('pageSentinel');

  playsQuery = injectInfiniteQuery(() => this.historyService.playsQueryOptions());

  plays = computed<HistoryPlay[]>(() => this.playsQuery.data()?.pages.flat() ?? []);
  groups = computed(() => groupHistoryByDay(this.plays()));
  isPending = computed(() => this.playsQuery.isPending());

  private readonly refreshErrorNotice = effect(() => {
    if (!this.playsQuery.data()) return;
    noticeRefreshErrors(this.queryErrorNotice, [this.playsQuery.error()], () =>
      this.retryPlaysQuery(),
    );
  });

  retryPlaysQuery(): void {
    if (this.playsQuery.isFetchNextPageError()) {
      void this.playsQuery.fetchNextPage();
    } else {
      void this.playsQuery.refetch();
    }
  }

  private indexByPlayId = computed(
    () => new Map(this.plays().map((play, index) => [play.id, index])),
  );

  private namedRow?: HistoryItemComponent;

  private rows = viewChildren(HistoryItemComponent);

  private previousUrl = this.router.currentNavigation()?.previousNavigation?.finalUrl?.toString();

  private uniqueShows = computed(() =>
    dedupeByKey(
      this.plays()
        .map((play) => play.show)
        .filter((show) => show.ids.tmdb != null),
      (show) => show.ids.trakt,
    ),
  );

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

  readonly observePageSentinel = effect((onCleanup) => {
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
    afterNextRender(() => this.nameRowReturnedFrom());
  }

  tmdbShowFor(play: HistoryPlay): TmdbShow | undefined {
    return this.tmdbShowsByTraktId().get(play.show.ids.trakt);
  }

  episodeLink(play: HistoryPlay): string {
    const { show, episode } = play;
    return `/shows/s/${getShowSlug(show)}/season/${episode.season}/episode/${episode.number}`;
  }

  prepareViewTransition(row: HistoryItemComponent): void {
    this.namedRow?.clearViewTransition();
    this.namedRow = row;
    row.prepareViewTransition();
  }

  private nameRowReturnedFrom(): void {
    const url = this.previousUrl;
    if (!url) return;

    const play = playForEpisodeUrl(this.plays(), url);
    const row = play && this.rows().find((row) => row.play().id === play.id);
    if (!row) return;

    this.prepareViewTransition(row);
    void this.viewTransition.whenFinished().then(() => {
      if (this.namedRow === row) this.namedRow.clearViewTransition();
    });
  }

  playIndex(play: HistoryPlay): number | undefined {
    return this.indexByPlayId().get(play.id);
  }

  tmdbEpisodeFor(play: HistoryPlay): TmdbEpisode | null | undefined {
    return this.tmdbEpisodesByKey().get(playKey(play));
  }

  async loadNextPage(): Promise<void> {
    if (!this.playsQuery.hasNextPage() || this.playsQuery.isFetchingNextPage()) return;

    await this.playsQuery.fetchNextPage().catch(() => undefined);
  }

  private language(): string {
    return this.configService.config.s().language;
  }
}

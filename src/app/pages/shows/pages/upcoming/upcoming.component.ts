import { Component, computed, effect, inject, Injector } from '@angular/core';
import { injectInfiniteQuery } from '@tanstack/angular-query-experimental';
import { EpisodeService } from '../../data/episode.service';
import { SpinnerComponent } from '@shared/components/spinner/spinner.component';
import {
  combineLatest,
  concatMap,
  forkJoin,
  from,
  lastValueFrom,
  map,
  Observable,
  of,
  take,
} from 'rxjs';
import { formatDate } from '@angular/common';
import { ShowsComponent } from '@shared/components/shows/shows.component';
import { Router } from '@angular/router';
import { EpisodeAiring, EpisodeFull, Translation } from '@type/Trakt';
import { ShowInfo } from '@type/Show';
import { TmdbService } from '../../data/tmdb.service';
import { translated } from '@helper/translation';
import { TranslationService } from '../../data/translation.service';
import { TmdbShow } from '@type/Tmdb';
import { addDays, isPast } from 'date-fns';
import { MatButton } from '@angular/material/button';
import { UpcomingFilter } from '@type/Enum';
import { ConfigService } from '@services/config.service';
import { ListService } from '../../../lists/data/list.service';
import { Config } from '@type/Config';
import { WatchlistItem } from '@type/TraktList';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 't-upcoming',
  imports: [SpinnerComponent, ShowsComponent, MatButton],
  templateUrl: './upcoming.component.html',
  styleUrl: './upcoming.component.scss',
})
export default class UpcomingComponent {
  episodeService = inject(EpisodeService);
  tmdbService = inject(TmdbService);
  translationService = inject(TranslationService);
  configService = inject(ConfigService);
  listService = inject(ListService);
  router = inject(Router);
  injector = inject(Injector);

  readonly PAGES_TO_FETCH = 6;

  upcomingEpisodesQuery = injectInfiniteQuery(() => ({
    queryKey: ['upcomingEpisodes'],
    queryFn: ({ pageParam }): Promise<ShowInfo[]> =>
      lastValueFrom(this.getUpcomingEpisodes$(pageParam)),
    initialPageParam: 0,
    getNextPageParam: (_lastPage, _allPages, lastPageParam): number => lastPageParam + 1,
  }));

  filteredEpisodePages = computed(() => {
    const episodePages = this.upcomingEpisodesQuery.data();
    if (!episodePages) return;

    const config = this.configService.config.s();
    const watchlistItems = this.listService.watchlistItems();

    return episodePages.pages.map((showInfos) => {
      return showInfos.filter(
        (showInfo: ShowInfo) =>
          !this.isWatchlistItem(showInfo, config, watchlistItems) &&
          !this.isSpecial(showInfo, config),
      );
    });
  });
  hasNextPage = this.upcomingEpisodesQuery.hasNextPage;
  isFetchingNextPage = this.upcomingEpisodesQuery.isFetchingNextPage;
  nextButtonDisabled = computed(() => !this.hasNextPage() || this.isFetchingNextPage());
  nextButtonText = computed(() => {
    const pageLoadCount = this.upcomingEpisodesQuery.data()?.pageParams.length;
    const startDaysToAdd = (pageLoadCount ?? 1) * UPCOMING_DAYS;
    const startDate = format(addDays(new Date(), startDaysToAdd));

    if (this.isFetchingNextPage()) return `Loading... (${startDate})`;

    const endDaysToAdd = startDaysToAdd + UPCOMING_DAYS - 1;
    const endDate = format(addDays(new Date(), endDaysToAdd));
    return `Load more (${startDate} - ${endDate})`;
  });

  constructor() {
    this.fetchPages();

    effect(() => {
      console.debug('upcomingEpisodesQuery', this.upcomingEpisodesQuery.data());
      console.debug('filteredEpisodePages', this.filteredEpisodePages());
    });
  }

  fetchPages(): void {
    const cachedPages = this.upcomingEpisodesQuery.data()?.pages.length ?? 0;
    const pagesToLoad = this.PAGES_TO_FETCH - cachedPages;
    if (pagesToLoad <= 0) return;

    from({ length: pagesToLoad })
      .pipe(
        concatMap(() => this.upcomingEpisodesQuery.fetchNextPage()),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  isSpecial(showInfo: ShowInfo, config: Config): boolean {
    const isSpecial = showInfo.nextEpisode?.season === 0;
    const isHidden = !!config.upcomingFilters.find((upcomingFilter) => {
      if (upcomingFilter.name !== UpcomingFilter.SPECIALS || !upcomingFilter.value) return false;
      return upcomingFilter.category === 'hide' ? isSpecial : !isSpecial;
    });
    return isHidden;
  }

  isWatchlistItem(showInfo: ShowInfo, config: Config, watchlistItems: WatchlistItem[]): boolean {
    if (!showInfo.show) return true;
    const isWatchlistItem = this.listService.isWatchlistItem(watchlistItems, showInfo.show);
    const isHidden = !!config.upcomingFilters.find((upcomingFilter) => {
      if (upcomingFilter.name !== UpcomingFilter.WATCHLIST_ITEM || !upcomingFilter.value)
        return false;
      return upcomingFilter.category === 'hide' ? isWatchlistItem : !isWatchlistItem;
    });
    return isHidden;
  }

  getUpcomingEpisodes$(page = 0): Observable<ShowInfo[]> {
    const start = format(addDays(new Date(), page * UPCOMING_DAYS));

    return this.episodeService.fetchCalendar(UPCOMING_DAYS, start).pipe(
      map((episodesAiring) =>
        episodesAiring.filter((episodeAiring) => !isPast(episodeAiring.first_aired)),
      ),
      concatMap((episodesAiring) =>
        forkJoin([
          of(episodesAiring),
          this.getShowsTranslations$(episodesAiring),
          this.getEpisodesTranslations$(episodesAiring),
          this.getTmdbShows$(episodesAiring),
        ]),
      ),
      map((v) => this.getUpcomingEpisodeInfos(...v)),
      take(1),
    );
  }

  getShowsTranslations$(episodesAiring: EpisodeAiring[]): Observable<Translation[]> {
    if (episodesAiring.length === 0) return of([]);
    return combineLatest(
      episodesAiring.map((episodeAiring) =>
        this.translationService.getShowTranslation$(episodeAiring.show, { sync: true }),
      ),
    ).pipe(take(1));
  }

  getEpisodesTranslations$(episodesAiring: EpisodeAiring[]): Observable<Translation[]> {
    if (episodesAiring.length === 0) return of([]);
    return combineLatest(
      episodesAiring.map((episodeAiring) => {
        return this.translationService.getEpisodeTranslation$(
          episodeAiring.show,
          episodeAiring.episode.season,
          episodeAiring.episode.number,
          { sync: true, fetch: true },
        );
      }),
    ).pipe(take(1));
  }

  getTmdbShows$(episodesAiring: EpisodeAiring[]): Observable<TmdbShow[]> {
    if (episodesAiring.length === 0) return of([]);
    return combineLatest(
      episodesAiring.map((episodeAiring) =>
        this.tmdbService.getTmdbShow$(episodeAiring.show, false, { fetchAlways: true }),
      ),
    ).pipe(take(1));
  }

  getUpcomingEpisodeInfos(
    episodesAiring: EpisodeAiring[],
    showsTranslations: Translation[],
    episodesTranslations: Translation[],
    tmdbShows: TmdbShow[],
  ): ShowInfo[] {
    return episodesAiring.map((episodeAiring, i) => ({
      show: translated(episodeAiring.show, showsTranslations[i]),
      nextEpisode: this.getEpisode(episodeAiring, episodesTranslations[i]),
      tmdbShow: tmdbShows[i],
    }));
  }

  getEpisode(episodeAiring: EpisodeAiring, episodesTranslation: Translation): EpisodeFull {
    const episode: Partial<EpisodeFull> = translated(episodeAiring.episode, episodesTranslation);
    episode.first_aired = episodeAiring.first_aired;
    return episode as EpisodeFull;
  }
}

export const UPCOMING_DAYS = 33;

export function format(date: Date): string {
  return formatDate(date, 'dd-MM-yyyy', 'en-US');
}

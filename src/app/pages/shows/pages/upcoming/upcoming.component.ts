import { Component, computed, effect, inject } from '@angular/core';
import { injectInfiniteQuery } from '@tanstack/angular-query-experimental';
import { injectQueries } from '@tanstack/angular-query-experimental/inject-queries-experimental';
import { EpisodeService } from '../../data/episode.service';
import { SpinnerComponent } from '@shared/components/spinner/spinner.component';
import { concatMap, lastValueFrom, map, range } from 'rxjs';
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
import { ErrorText } from '@shared/components/error-text/error-text.component';
import { queryKeys } from '@shared/query-keys';

@Component({
  selector: 't-upcoming',
  imports: [SpinnerComponent, ShowsComponent, MatButton, ErrorText],
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

  readonly PAGES_TO_FETCH = 6;

  upcomingEpisodesQuery = injectInfiniteQuery(() => ({
    queryKey: ['upcomingEpisodes'],
    queryFn: ({ pageParam }): Promise<EpisodeAiring[]> =>
      lastValueFrom(
        this.episodeService
          .fetchCalendar(
            UPCOMING_DAYS,
            formatForTraktApi(addDays(new Date(), pageParam * UPCOMING_DAYS)),
          )
          .pipe(map((airings) => airings.filter((airing) => !isPast(airing.first_aired)))),
      ),
    initialPageParam: 0,
    getNextPageParam: (_lastPage, _allPages, lastPageParam): number => lastPageParam + 1,
  }));

  airings = computed(() => this.upcomingEpisodesQuery.data()?.pages.flat() ?? []);

  episodeTranslationQueries = injectQueries(() => {
    const language = this.configService.config.s().language;
    return {
      queries: this.airings().map((airing) => ({
        queryKey: queryKeys.upcomingEpisodeTranslation(
          airing.show.ids.trakt,
          airing.episode.season,
          airing.episode.number,
          language,
        ),
        queryFn: (): Promise<Translation | undefined> =>
          this.translationService.ensureEpisodeTranslation(
            airing.show,
            airing.episode.season,
            airing.episode.number,
            { persist: true },
          ),
      })),
    };
  });

  tmdbShowQueries = injectQueries(() => {
    const language = this.configService.config.s().language;
    return {
      queries: this.airings().map((airing) => ({
        queryKey: queryKeys.upcomingTmdbShow(airing.show.ids.tmdb, language),
        queryFn: (): Promise<TmdbShow> =>
          this.tmdbService.fetchTmdbShowEntry(airing.show, { force: true }),
        enabled: airing.show.ids.tmdb != null,
      })),
    };
  });

  showInfos = computed<ShowInfo[][] | undefined>(() => {
    const pages = this.upcomingEpisodesQuery.data()?.pages;
    if (!pages) return undefined;
    const translations = this.episodeTranslationQueries().map((query) => query.data());
    const tmdbShows = this.tmdbShowQueries().map((query) => query.data());
    let cursor = 0;
    return pages.map((page) =>
      page.map((airing) => {
        const info = this.toShowInfo(
          airing,
          this.translationService.getShowTranslation(airing.show),
          translations[cursor],
          tmdbShows[cursor],
        );
        cursor += 1;
        return info;
      }),
    );
  });

  filteredEpisodePages = computed(() => {
    const episodePages = this.showInfos();
    if (!episodePages) return;

    const config = this.configService.config.s();
    const watchlistItems = this.listService.watchlistItems();

    return episodePages.map((showInfos) => {
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

  readonly logEpisodes = effect(() => {
    console.debug('upcomingEpisodesQuery', this.upcomingEpisodesQuery.data());
    console.debug('showInfos', this.showInfos());
    console.debug('filteredEpisodePages', this.filteredEpisodePages());
  });

  constructor() {
    this.fetchPages();
  }

  fetchPages(): void {
    const cachedPages = this.upcomingEpisodesQuery.data()?.pages.length ?? 0;
    const pagesToLoad = this.PAGES_TO_FETCH - cachedPages;
    if (pagesToLoad <= 0) return;

    range(0, pagesToLoad)
      .pipe(
        concatMap(() => this.upcomingEpisodesQuery.fetchNextPage()),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  isSpecial(showInfo: ShowInfo, config: Config): boolean {
    const isSpecial = showInfo.nextEpisode?.season === 0;
    const isHidden = config.upcomingFilters.some((upcomingFilter) => {
      if (upcomingFilter.name !== UpcomingFilter.SPECIALS || !upcomingFilter.value) return false;
      return upcomingFilter.category === 'hide' ? isSpecial : !isSpecial;
    });
    return isHidden;
  }

  isWatchlistItem(showInfo: ShowInfo, config: Config, watchlistItems: WatchlistItem[]): boolean {
    if (!showInfo.show) return true;
    const isWatchlistItem = this.listService.isWatchlistItem(watchlistItems, showInfo.show);
    const isHidden = config.upcomingFilters.some((upcomingFilter) => {
      if (upcomingFilter.name !== UpcomingFilter.WATCHLIST_ITEM || !upcomingFilter.value)
        return false;
      return upcomingFilter.category === 'hide' ? isWatchlistItem : !isWatchlistItem;
    });
    return isHidden;
  }

  toShowInfo(
    airing: EpisodeAiring,
    showTranslation: Translation | undefined,
    episodeTranslation: Translation | undefined,
    tmdbShow: TmdbShow | undefined,
  ): ShowInfo {
    return {
      show: translated(airing.show, showTranslation),
      nextEpisode: this.getEpisode(airing, episodeTranslation),
      tmdbShow,
    };
  }

  getEpisode(
    episodeAiring: EpisodeAiring,
    episodesTranslation: Translation | undefined,
  ): EpisodeFull {
    const episode: Partial<EpisodeFull> = translated(episodeAiring.episode, episodesTranslation);
    episode.first_aired = episodeAiring.first_aired;
    return episode as EpisodeFull;
  }
}

export const UPCOMING_DAYS = 33;

export function format(date: Date): string {
  return formatDate(date, 'dd-MM-yyyy', 'en-US');
}

export function formatForTraktApi(date: Date): string {
  return formatDate(date, 'yyyy-MM-dd', 'en-US');
}

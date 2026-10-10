import { Component, computed, effect, inject } from '@angular/core';
import { injectInfiniteQuery } from '@tanstack/angular-query-experimental';
import { injectQueries } from '@tanstack/angular-query-experimental/inject-queries-experimental';
import { EpisodeService } from '../../data/episode.service';
import { SpinnerComponent } from '@shared/components/spinner/spinner.component';
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
    queryFn: async ({ pageParam }): Promise<EpisodeAiring[]> => {
      const airings = await this.episodeService.fetchCalendar(
        UPCOMING_DAYS,
        formatForTraktApi(addDays(new Date(), pageParam * UPCOMING_DAYS)),
      );
      return airings.filter((airing) => !isPast(airing.first_aired));
    },
    initialPageParam: 0,
    getNextPageParam: (_lastPage, _allPages, lastPageParam): number => lastPageParam + 1,
  }));

  airings = computed(() => this.upcomingEpisodesQuery.data()?.pages.flat() ?? []);

  uniqueTranslationAirings = computed<EpisodeAiring[]>(() => {
    const language = this.configService.config.s().language;
    if (language === 'en-US') return [];
    return dedupeByKey(this.airings(), (airing) => translationKey(airing, language));
  });

  uniqueTmdbAirings = computed<EpisodeAiring[]>(() => {
    const language = this.configService.config.s().language;
    return dedupeByKey(
      this.airings().filter((airing) => airing.show.ids.tmdb != null),
      (airing) => tmdbKey(airing, language),
    );
  });

  episodeTranslationQueries = injectQueries(() => {
    const language = this.configService.config.s().language;
    return {
      queries: this.uniqueTranslationAirings().map((airing) => ({
        queryKey: queryKeys.upcomingEpisodeTranslation(
          airing.show.ids.trakt,
          airing.episode.season,
          airing.episode.number,
          language,
        ),
        queryFn: (): Promise<Translation | null> =>
          this.translationService
            .ensureEpisodeTranslation(airing.show, airing.episode.season, airing.episode.number, {
              persist: true,
            })
            .then((translation) => translation ?? null),
      })),
    };
  });

  tmdbShowQueries = injectQueries(() => {
    const language = this.configService.config.s().language;
    return {
      queries: this.uniqueTmdbAirings().map((airing) => ({
        queryKey: queryKeys.upcomingTmdbShow(airing.show.ids.tmdb, language),
        queryFn: (): Promise<TmdbShow> =>
          this.tmdbService.fetchTmdbShowEntry(airing.show, { force: true }),
      })),
    };
  });

  showInfos = computed<ShowInfo[][] | undefined>(() => {
    const pages = this.upcomingEpisodesQuery.data()?.pages;
    if (!pages) return undefined;
    const language = this.configService.config.s().language;
    const translationResults = this.episodeTranslationQueries();
    const translationsByKey = new Map(
      this.uniqueTranslationAirings().map((airing, index) => [
        translationKey(airing, language),
        translationResults[index]?.data() ?? undefined,
      ]),
    );

    const tmdbResults = this.tmdbShowQueries();
    const tmdbByKey = new Map(
      this.uniqueTmdbAirings().map((airing, index) => [
        tmdbKey(airing, language),
        tmdbResults[index]?.data(),
      ]),
    );

    return pages.map((page) =>
      page.map((airing) => {
        const info = this.toShowInfo(
          airing,
          this.translationService.getShowTranslation(airing.show),
          translationsByKey.get(translationKey(airing, language)),
          tmdbByKey.get(tmdbKey(airing, language)),
        );
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

  async fetchPages(): Promise<void> {
    const cachedPages = this.upcomingEpisodesQuery.data()?.pages.length ?? 0;
    const pagesToLoad = this.PAGES_TO_FETCH - cachedPages;
    if (pagesToLoad <= 0) return;

    for (let page = 0; page < pagesToLoad; page++) {
      await this.upcomingEpisodesQuery.fetchNextPage();
    }
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

function dedupeByKey<T>(items: T[], keyFor: (item: T) => string): T[] {
  const seen = new Set<string>();
  return items.filter((item: T): boolean => {
    const key = keyFor(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function translationKey(airing: EpisodeAiring, language: string): string {
  return JSON.stringify(
    queryKeys.upcomingEpisodeTranslation(
      airing.show.ids.trakt,
      airing.episode.season,
      airing.episode.number,
      language,
    ),
  );
}

function tmdbKey(airing: EpisodeAiring, language: string): string {
  return JSON.stringify(queryKeys.upcomingTmdbShow(airing.show.ids.tmdb, language));
}

export function format(date: Date): string {
  return formatDate(date, 'dd-MM-yyyy', 'en-US');
}

export function formatForTraktApi(date: Date): string {
  return formatDate(date, 'yyyy-MM-dd', 'en-US');
}

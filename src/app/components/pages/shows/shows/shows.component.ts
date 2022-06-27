import { Component, OnDestroy, OnInit } from '@angular/core';
import { EpisodeFull, ShowHidden, ShowProgress } from '../../../../../types/interfaces/Trakt';
import { TmdbShow } from '../../../../../types/interfaces/Tmdb';
import { combineLatest, Subject, Subscription, tap } from 'rxjs';
import { ShowService } from '../../../../services/show.service';
import { TmdbService } from '../../../../services/tmdb.service';
import { ConfigService } from '../../../../services/config.service';
import { wait } from '../../../../helper/wait';
import { ShowInfo } from '../../../../../types/interfaces/Show';
import { Filter, Sort, SortOptions } from '../../../../../types/enum';
import { episodeId } from '../../../../helper/episodeId';

@Component({
  selector: 'app-shows-page',
  templateUrl: './shows.component.html',
  styleUrls: ['./shows.component.scss'],
})
export class ShowsComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  shows: ShowInfo[] = [];
  isLoading = new Subject<boolean>();

  constructor(
    public showService: ShowService,
    public tmdbService: TmdbService,
    private configService: ConfigService
  ) {}

  ngOnInit(): void {
    this.subscriptions = [
      combineLatest([
        this.showService.showsWatched,
        this.showService.showsProgress,
        this.showService.showsHidden,
        this.showService.showsEpisodes,
        this.showService.favorites,
        this.showService.addedShowInfos,
        this.configService.config,
        this.tmdbService.tmdbShows,
      ])
        .pipe(tap(() => this.isLoading.next(true)))
        .subscribe({
          next: async ([
            showsWatched,
            showsProgress,
            showsHidden,
            showsEpisodes,
            favorites,
            addedShowInfos,
            config,
            tmdbShows,
          ]) => {
            const showsAll = [
              ...showsWatched.map((showWatched) => showWatched.show),
              ...Object.values(addedShowInfos).map((showInfo) => showInfo.show),
            ];
            Object.entries(addedShowInfos).forEach(([id, showInfo]) => {
              const showId = parseInt(id);
              showsProgress[showId] = showInfo.showProgress as ShowProgress;
              tmdbShows[showInfo.show.ids.tmdb] = showInfo.tmdbShow as TmdbShow;
              showsEpisodes[
                episodeId(
                  showId,
                  (showInfo.showProgress as ShowProgress).next_episode.season,
                  (showInfo.showProgress as ShowProgress).next_episode.number
                )
              ] = showInfo.nextEpisode as EpisodeFull;
            });

            for (const show of showsAll) {
              if (!tmdbShows[show.ids.tmdb]) return;
              const showProgress = showsProgress[show.ids.trakt];
              if (!showProgress) return;
              if (
                showProgress.next_episode &&
                !showsEpisodes[
                  episodeId(
                    show.ids.trakt,
                    showProgress.next_episode.season,
                    showProgress.next_episode.number
                  )
                ]
              )
                return;
            }

            const shows: ShowInfo[] = [];

            showsAll.forEach((show) => {
              const showProgress = showsProgress[show.ids.trakt];
              const tmdbShow = tmdbShows[show.ids.tmdb];

              for (const filter of config.filters.filter((filter) => filter.value)) {
                switch (filter.name) {
                  case Filter.NO_NEW_EPISODES:
                    if (this.hideNoNewEpisodes(showProgress)) return;
                    break;
                  case Filter.COMPLETED:
                    if (this.hideCompleted(showProgress, tmdbShow)) return;
                    break;
                  case Filter.HIDDEN:
                    if (this.hideHidden(showsHidden, show.ids.trakt)) return;
                    break;
                }
              }

              const favorite = favorites.includes(show.ids.trakt);
              const nextEpisode =
                showProgress.next_episode &&
                this.showService.getEpisode(
                  show.ids.trakt,
                  showProgress.next_episode.season,
                  showProgress.next_episode.number
                );

              shows.push({ show, showProgress, tmdbShow, favorite, nextEpisode });
            });

            switch (config.sort.by) {
              case Sort.NEWEST_EPISODE:
                shows.sort((a, b) => this.sortByNewestEpisode(a, b, showsEpisodes));
                break;
              case Sort.LAST_WATCHED:
                break;
            }

            switch (config.sortOptions.find((sortOption) => sortOption.value)?.name) {
              case SortOptions.FAVORITES_FIRST:
                shows.sort((a, b) => this.sortFavoritesFirst(a, b));
                break;
            }

            await wait();
            this.isLoading.next(false);
            this.shows = shows;
          },
          error: () => this.isLoading.next(false),
        }),
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  private hideHidden(showsHidden: ShowHidden[], id: number): boolean {
    return !!showsHidden.find((show) => show.show.ids.trakt === id);
  }

  private hideNoNewEpisodes(showProgress: ShowProgress | undefined): boolean {
    return !!showProgress && showProgress.aired === showProgress.completed;
  }

  private hideCompleted(
    showProgress: ShowProgress | undefined,
    tmdbShow: TmdbShow | undefined
  ): boolean {
    return (
      !!showProgress &&
      !!tmdbShow &&
      ['Ended', 'Canceled'].includes(tmdbShow.status) &&
      showProgress.aired === showProgress.completed
    );
  }

  private sortByNewestEpisode(
    a: ShowInfo,
    b: ShowInfo,
    showsEpisodes: { [id: string]: EpisodeFull }
  ): number {
    const nextEpisodeA =
      a.showProgress?.next_episode &&
      showsEpisodes[
        episodeId(
          a.show.ids.trakt,
          a.showProgress.next_episode.season,
          a.showProgress.next_episode.number
        )
      ];
    const nextEpisodeB =
      b.showProgress?.next_episode &&
      showsEpisodes[
        episodeId(
          b.show.ids.trakt,
          b.showProgress.next_episode.season,
          b.showProgress.next_episode.number
        )
      ];
    if (!nextEpisodeA) return 1;
    if (!nextEpisodeB) return -1;
    return (
      new Date(nextEpisodeB.first_aired).getTime() - new Date(nextEpisodeA.first_aired).getTime()
    );
  }

  private sortFavoritesFirst(a: ShowInfo, b: ShowInfo): number {
    if (a.favorite && !b.favorite) return -1;
    return 1;
  }
}

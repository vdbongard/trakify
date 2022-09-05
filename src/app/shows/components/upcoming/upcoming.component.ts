import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  BehaviorSubject,
  combineLatest,
  defaultIfEmpty,
  map,
  of,
  switchMap,
  takeUntil,
} from 'rxjs';

import { ShowService } from '../../../shared/services/trakt/show.service';
import { TmdbService } from '../../../shared/services/tmdb.service';
import { BaseComponent } from '../../../shared/helper/base-component';
import { EpisodeService } from '../../../shared/services/trakt/episode.service';
import { onError } from '../../../shared/helper/error';
import { ListService } from '../../../shared/services/trakt/list.service';
import { ConfigService } from '../../../shared/services/config.service';

import { LoadingState, UpcomingFilter } from 'src/types/enum';

import type { ShowInfo } from 'src/types/interfaces/Show';
import type { EpisodeFull } from 'src/types/interfaces/Trakt';

@Component({
  selector: 't-upcoming',
  templateUrl: './upcoming.component.html',
  styleUrls: ['./upcoming.component.scss'],
})
export class UpcomingComponent extends BaseComponent implements OnInit {
  pageState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  showsInfosAll = new BehaviorSubject<ShowInfo[] | undefined>(undefined);
  showsInfos?: ShowInfo[];

  constructor(
    public showService: ShowService,
    public tmdbService: TmdbService,
    private episodeService: EpisodeService,
    private snackBar: MatSnackBar,
    private listService: ListService,
    private configService: ConfigService
  ) {
    super();
  }

  ngOnInit(): void {
    this.episodeService
      .getUpcomingEpisodes$(198)
      .pipe(
        switchMap((episodesAiring) =>
          combineLatest([
            of(episodesAiring),
            combineLatest(
              episodesAiring.map((episodeAiring) =>
                this.tmdbService.getTmdbShow$(episodeAiring.show.ids)
              )
            ).pipe(defaultIfEmpty([])),
          ])
        ),
        map(([episodesAiring, tmdbShows]) => {
          return episodesAiring.map((episodeAiring, i): ShowInfo => {
            const episodeFull: Partial<EpisodeFull> = episodeAiring.episode;
            episodeFull.first_aired = episodeAiring.first_aired;
            return {
              show: episodeAiring.show,
              nextEpisode: episodeFull as EpisodeFull,
              tmdbShow: tmdbShows[i],
            };
          });
        }),
        map((shows) => {
          let showInfos = this.showsInfosAll.value;
          if (!showInfos) showInfos = [];
          showInfos.push(...shows);
          this.showsInfosAll.next(showInfos);
          this.pageState.next(LoadingState.SUCCESS);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({ error: (error) => onError(error, this.snackBar, this.pageState) });

    combineLatest([
      this.configService.config.$,
      this.listService.getWatchlistItems$(),
      this.showsInfosAll,
    ]).subscribe(([config, watchlistItems, showsInfosAll]) => {
      this.showsInfos = showsInfosAll?.filter((showInfo) => {
        if (!showInfo.show) return true;

        const watchlistIds =
          watchlistItems?.map((watchlistItem) => watchlistItem.show.ids.trakt) ?? [];

        return config.upcomingFilters.find(
          (upcomingFilter) =>
            upcomingFilter.name === UpcomingFilter.WATCHLIST_ITEM && upcomingFilter.value
        )
          ? !watchlistIds.includes(showInfo.show.ids.trakt)
          : true;
      });
    });
  }
}

import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, combineLatest, takeUntil } from 'rxjs';

import { ShowService } from '@services/trakt/show.service';
import { TmdbService } from '@services/tmdb.service';
import { BaseComponent } from '@helper/base-component';
import { EpisodeService } from '@services/trakt/episode.service';
import { ListService } from '@services/trakt/list.service';
import { ConfigService } from '@services/config.service';
import { onError } from '@helper/error';

import { LoadingState, UpcomingFilter } from '@type/enum';

import type { ShowInfo } from '@type/interfaces/Show';
import { Router } from '@angular/router';
import { isEqualDeep } from '@helper/isEqualDeep';

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
    private configService: ConfigService,
    public router: Router
  ) {
    super();
  }

  ngOnInit(): void {
    this.episodeService
      .getUpcomingEpisodeInfos$(198)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (showInfos) => {
          let showInfosAll = this.showsInfosAll.value;
          if (!showInfosAll) showInfosAll = [];
          showInfosAll.push(...showInfos);
          this.showsInfosAll.next(showInfosAll);
          this.pageState.next(LoadingState.SUCCESS);
        },
        error: (error) => onError(error, this.snackBar, this.pageState),
      });

    combineLatest([
      this.configService.config.$,
      this.listService.getWatchlistItems$(),
      this.showsInfosAll,
    ]).subscribe(([config, watchlistItems, showsInfosAll]) => {
      const showsInfos = showsInfosAll?.filter((showInfo) => {
        if (!showInfo.show) return true;

        const watchlistIds =
          watchlistItems?.map((watchlistItem) => watchlistItem.show.ids.trakt) ?? [];

        const isWatchlistItem =
          config.upcomingFilters.find(
            (upcomingFilter) =>
              upcomingFilter.name === UpcomingFilter.WATCHLIST_ITEM && upcomingFilter.value
          ) && watchlistIds.includes(showInfo.show.ids.trakt);

        const isSpecial =
          config.upcomingFilters.find(
            (upcomingFilter) =>
              upcomingFilter.name === UpcomingFilter.SPECIALS && upcomingFilter.value
          ) && showInfo.nextEpisode?.season === 0;

        return !(isWatchlistItem || isSpecial);
      });

      if (isEqualDeep(showsInfos, this.showsInfos)) return;

      this.showsInfos = showsInfos;
      console.debug('showsInfos', this.showsInfos);
    });
  }
}

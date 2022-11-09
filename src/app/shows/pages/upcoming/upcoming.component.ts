import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, combineLatest, takeUntil } from 'rxjs';

import { ShowService } from '../../data/show.service';
import { TmdbService } from '../../data/tmdb.service';
import { BaseComponent } from '@helper/base-component';
import { EpisodeService } from '../../data/episode.service';
import { ListService } from '../../../lists/data/list.service';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    public router: Router,
    private cdr: ChangeDetectorRef
  ) {
    super();
  }

  ngOnInit(): void {
    this.episodeService
      .getUpcomingEpisodeInfos$(198)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (showInfos) => {
          this.cdr.markForCheck();
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
      if (!showsInfosAll) return;

      const showsInfos = showsInfosAll?.filter((showInfo) => {
        if (!showInfo.show) return true;

        const isWatchlistItem = this.listService.isWatchlistItem(watchlistItems, showInfo.show);
        const isWatchlistItemsFilteredOut = !!config.upcomingFilters.find((upcomingFilter) => {
          if (upcomingFilter.name !== UpcomingFilter.WATCHLIST_ITEM || !upcomingFilter.value)
            return false;
          return upcomingFilter.category === 'hide' ? isWatchlistItem : !isWatchlistItem;
        });

        const isSpecial = showInfo.nextEpisode?.season === 0;
        const isSpecialFilteredOut = !!config.upcomingFilters.find((upcomingFilter) => {
          if (upcomingFilter.name !== UpcomingFilter.SPECIALS || !upcomingFilter.value)
            return false;
          return upcomingFilter.category === 'hide' ? isSpecial : !isSpecial;
        });

        return !(isWatchlistItemsFilteredOut || isSpecialFilteredOut);
      });

      if (isEqualDeep(showsInfos, this.showsInfos)) return;

      this.cdr.markForCheck();
      this.showsInfos = showsInfos;
      console.debug('showsInfos', this.showsInfos);
    });
  }
}

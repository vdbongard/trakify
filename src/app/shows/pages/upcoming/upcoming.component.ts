import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, combineLatest, map, startWith, takeUntil, timer } from 'rxjs';
import { Base } from '@helper/base';
import { EpisodeService } from '../../data/episode.service';
import { ListService } from '../../../lists/data/list.service';
import { ConfigService } from '@services/config.service';
import { onError } from '@helper/error';

import { LoadingState, UpcomingFilter } from '@type/Enum';

import type { ShowInfo } from '@type/Show';
import { Router } from '@angular/router';
import { isEqualDeep } from '@helper/isEqualDeep';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { ShowsComponent } from '@shared/components/shows/shows.component';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 't-upcoming',
  templateUrl: './upcoming.component.html',
  styleUrls: ['./upcoming.component.scss'],
  standalone: true,
  imports: [LoadingComponent, ShowsComponent, AsyncPipe],
})
export class UpcomingComponent extends Base implements OnInit {
  pageState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  showsInfosAll = new BehaviorSubject<ShowInfo[] | undefined>(undefined);
  showsInfos?: ShowInfo[];

  // disable list transition while upcoming episodes are loading which leads to a lagging scroll animation
  transitionDisabled = timer(3000).pipe(
    startWith(true),
    map((v) => !!v),
    takeUntil(this.destroy$)
  );

  constructor(
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
        error: (error) => onError(error, this.snackBar, [this.pageState]),
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

      this.showsInfos = showsInfos;
      console.debug('showsInfos', this.showsInfos);
    });
  }
}

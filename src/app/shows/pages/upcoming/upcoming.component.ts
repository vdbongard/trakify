import { Component, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, combineLatest, debounceTime, distinctUntilChanged } from 'rxjs';
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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 't-upcoming',
  templateUrl: './upcoming.component.html',
  styleUrls: ['./upcoming.component.scss'],
  standalone: true,
  imports: [LoadingComponent, ShowsComponent, AsyncPipe],
})
export default class UpcomingComponent {
  episodeService = inject(EpisodeService);
  snackBar = inject(MatSnackBar);
  listService = inject(ListService);
  configService = inject(ConfigService);
  router = inject(Router);

  pageState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  showsInfosAll = new BehaviorSubject<ShowInfo[] | undefined>(undefined);
  showsInfos?: ShowInfo[];

  // disable list transition while upcoming episodes are loading which leads to a lagging scroll animation
  private transitionDisabled = new BehaviorSubject<boolean>(true);
  transitionDisabled$ = this.transitionDisabled
    .asObservable()
    .pipe(distinctUntilChanged(), debounceTime(1000));

  constructor() {
    this.episodeService
      .getUpcomingEpisodeInfos$(198)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (showInfos) => {
          let showInfosAll = this.showsInfosAll.value;
          if (!showInfosAll) showInfosAll = [];
          showInfosAll.push(...showInfos);
          this.transitionDisabled.next(true);
          this.showsInfosAll.next(showInfosAll);
          this.transitionDisabled.next(false);
          this.pageState.next(LoadingState.SUCCESS);
        },
        error: (error) => onError(error, this.snackBar, [this.pageState]),
      });

    combineLatest([
      this.configService.config.$,
      this.listService.getWatchlistItems$(),
      this.showsInfosAll,
    ])
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: ([config, watchlistItems, showsInfosAll]) => {
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
        },
      });
  }
}

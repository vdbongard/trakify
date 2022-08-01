import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, Subscription, takeUntil } from 'rxjs';
import { ShowInfo } from '../../../../types/interfaces/Show';
import { ShowService } from '../../../services/trakt/show.service';
import { TmdbService } from '../../../services/tmdb.service';
import { ListService } from '../../../services/trakt/list.service';
import { BaseComponent } from '../../../helper/base-component';
import { LoadingState } from '../../../../types/enum';
import { onError } from '../../../helper/error';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-watchlist',
  templateUrl: './watchlist.component.html',
  styleUrls: ['./watchlist.component.scss'],
})
export class WatchlistComponent extends BaseComponent implements OnInit {
  loadingState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  showsInfos: ShowInfo[] = [];

  constructor(
    public showService: ShowService,
    public tmdbService: TmdbService,
    public listService: ListService,
    private snackBar: MatSnackBar
  ) {
    super();
  }

  ngOnInit(): void {
    this.listService.updated.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.getWatchlist();
      },
      error: (error) => onError(error, this.snackBar, this.loadingState),
    });
  }

  getWatchlist(): Subscription {
    return combineLatest([
      this.listService.getWatchlistItems$(),
      this.tmdbService.tmdbShows$,
    ]).subscribe({
      next: async ([watchlistItems, tmdbShows]) => {
        this.showsInfos =
          watchlistItems?.map((watchlistItem) => {
            return {
              show: watchlistItem.show,
              tmdbShow: tmdbShows[watchlistItem.show.ids.tmdb],
              isWatchlist: true,
            };
          }) ?? [];
        this.loadingState.next(LoadingState.SUCCESS);
      },
      error: (error) => onError(error, this.snackBar, this.loadingState),
    });
  }
}

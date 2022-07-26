import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, Subscription, takeUntil } from 'rxjs';
import { ShowInfo } from '../../../../types/interfaces/Show';
import { ShowService } from '../../../services/trakt/show.service';
import { TmdbService } from '../../../services/tmdb.service';
import { ListService } from '../../../services/trakt/list.service';
import { BaseComponent } from '../../../helper/base-component';
import { LoadingState } from '../../../../types/enum';

@Component({
  selector: 'app-watchlist',
  templateUrl: './watchlist.component.html',
  styleUrls: ['./watchlist.component.scss'],
})
export class WatchlistComponent extends BaseComponent implements OnInit {
  loadingState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  shows: ShowInfo[] = [];

  constructor(
    public showService: ShowService,
    public tmdbService: TmdbService,
    public listService: ListService
  ) {
    super();
  }

  ngOnInit(): void {
    this.listService.updated.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.getWatchlist();
    });
  }

  getWatchlist(): Subscription {
    return combineLatest([
      this.listService.getWatchlistItems$(),
      this.tmdbService.tmdbShows$,
    ]).subscribe({
      next: async ([watchlistItems, tmdbShows]) => {
        this.shows =
          watchlistItems?.map((watchlistItem) => {
            return {
              show: watchlistItem.show,
              tmdbShow: tmdbShows[watchlistItem.show.ids.tmdb],
              isWatchlist: true,
            };
          }) || [];
        this.loadingState.next(LoadingState.SUCCESS);
      },
      error: () => this.loadingState.next(LoadingState.ERROR),
    });
  }
}

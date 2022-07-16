import { Component, OnInit } from '@angular/core';
import { combineLatest, Subject, Subscription, takeUntil } from 'rxjs';
import { ShowInfo } from '../../../../types/interfaces/Show';
import { ShowService } from '../../../services/show.service';
import { TmdbService } from '../../../services/tmdb.service';
import { ListService } from '../../../services/list.service';
import { BaseComponent } from '../../../helper/base-component';
import { LoadingState } from '../../../../types/enum';
import { wait } from '../../../helper/wait';

@Component({
  selector: 'app-watchlist',
  templateUrl: './watchlist.component.html',
  styleUrls: ['./watchlist.component.scss'],
})
export class WatchlistComponent extends BaseComponent implements OnInit {
  loadingState = new Subject<LoadingState>();
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
    return combineLatest([this.listService.watchlist$, this.tmdbService.tmdbShows$]).subscribe({
      next: async ([watchlistItems, tmdbShows]) => {
        this.shows = watchlistItems.map((watchlistItem) => {
          return {
            show: watchlistItem.show,
            tmdbShow: tmdbShows[watchlistItem.show.ids.tmdb],
            isWatchlist: true,
          };
        });
        await wait();
        this.loadingState.next(LoadingState.SUCCESS);
      },
      error: () => this.loadingState.next(LoadingState.ERROR),
    });
  }
}

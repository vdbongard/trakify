import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, Subscription, tap } from 'rxjs';
import { ShowInfo } from '../../../../types/interfaces/Show';
import { ShowService } from '../../../services/show.service';
import { TmdbService } from '../../../services/tmdb.service';
import { wait } from '../../../helper/wait';
import { ListService } from '../../../services/list.service';

@Component({
  selector: 'app-watchlist',
  templateUrl: './watchlist.component.html',
  styleUrls: ['./watchlist.component.scss'],
})
export class WatchlistComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  shows: ShowInfo[] = [];
  isLoading = new BehaviorSubject<boolean>(false);

  constructor(
    public showService: ShowService,
    public tmdbService: TmdbService,
    public listService: ListService
  ) {}

  ngOnInit(): void {
    this.subscriptions = [
      this.listService.updated.subscribe(() => {
        this.getWatchlist();
      }),
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  getWatchlist(): Subscription {
    return combineLatest([this.listService.watchlist$, this.tmdbService.tmdbShows$])
      .pipe(tap(() => this.isLoading.next(true)))
      .subscribe(async ([watchlistItems, tmdbShows]) => {
        this.shows = watchlistItems.map((watchlistItem) => {
          return {
            show: watchlistItem.show,
            tmdbShow: tmdbShows[watchlistItem.show.ids.tmdb],
            isWatchlist: true,
          };
        });
        await wait();
        this.isLoading.next(false);
      });
  }
}

import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, forkJoin, of, Subscription, switchMap, tap, zip } from 'rxjs';
import { ShowInfo } from '../../../../types/interfaces/Show';
import { ShowService } from '../../../services/show.service';
import { TmdbService } from '../../../services/tmdb.service';
import { wait } from '../../../helper/wait';

@Component({
  selector: 'app-watchlist',
  templateUrl: './watchlist.component.html',
  styleUrls: ['./watchlist.component.scss'],
})
export class WatchlistComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  shows: ShowInfo[] = [];
  isLoading = new BehaviorSubject<boolean>(false);

  constructor(public showService: ShowService, public tmdbService: TmdbService) {}

  ngOnInit(): void {
    this.subscriptions = [
      this.showService.updated.subscribe(() => {
        this.getWatchlist();
      }),
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  getWatchlist(): Subscription {
    return this.showService
      .fetchWatchlist()
      .pipe(
        tap(() => this.isLoading.next(true)),
        switchMap((watchlistItems) =>
          zip([
            of(watchlistItems),
            forkJoin(
              watchlistItems.map((watchlistItem) =>
                this.tmdbService.fetchShow(watchlistItem.show.ids.tmdb)
              )
            ),
          ])
        )
      )
      .subscribe(async ([watchlistItems, tmdbShows]) => {
        this.shows = watchlistItems.map((watchlistItem, i) => {
          return {
            show: watchlistItem.show,
            tmdbShow: tmdbShows[i],
          };
        });
        await wait();
        this.isLoading.next(false);
      });
  }
}

import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, Subscription, tap } from 'rxjs';
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
      combineLatest([this.showService.fetchWatchlist(), this.tmdbService.tmdbShows])
        .pipe(
          tap(() => {
            this.shows = [];
            this.isLoading.next(true);
          })
        )
        .subscribe(async ([watchlistItems, tmdbShows]) => {
          watchlistItems.forEach((watchlistItem) => {
            this.shows.push({
              show: watchlistItem.show,
              tmdbShow: tmdbShows[watchlistItem.show.ids.tmdb],
            });
          });
          await wait();
          this.isLoading.next(false);
        }),
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}

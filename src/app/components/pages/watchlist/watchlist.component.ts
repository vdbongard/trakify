import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, forkJoin, Subscription, switchMap, tap } from 'rxjs';
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
      this.showService
        .fetchWatchlist()
        .pipe(
          tap(() => {
            this.shows = [];
            this.isLoading.next(true);
          }),
          switchMap((watchlistItems) => {
            watchlistItems.forEach((watchlistItem) => {
              this.shows.push({
                show: watchlistItem.show,
              });
            });
            return forkJoin(
              watchlistItems.map((watchlistItem) =>
                this.tmdbService.fetchShow(watchlistItem.show.ids.tmdb)
              )
            );
          })
        )
        .subscribe(async (tmdbShows) => {
          tmdbShows.forEach((tmdbShow, i) => {
            this.shows[i] = { ...this.shows[i], tmdbShow };
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

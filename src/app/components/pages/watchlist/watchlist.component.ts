import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, Subscription, takeUntil, tap } from 'rxjs';
import { ShowInfo } from '../../../../types/interfaces/Show';
import { ShowService } from '../../../services/show.service';
import { TmdbService } from '../../../services/tmdb.service';
import { wait } from '../../../helper/wait';
import { ListService } from '../../../services/list.service';
import { BaseComponent } from '../../../helper/base-component';

@Component({
  selector: 'app-watchlist',
  templateUrl: './watchlist.component.html',
  styleUrls: ['./watchlist.component.scss'],
})
export class WatchlistComponent extends BaseComponent implements OnInit {
  shows: ShowInfo[] = [];
  isLoading = new BehaviorSubject<boolean>(false);

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

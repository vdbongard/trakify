import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, Subscription, tap } from 'rxjs';
import { ShowService } from '../../../../services/show.service';
import { TmdbService } from '../../../../services/tmdb.service';
import { wait } from '../../../../helper/wait';
import { ShowInfo } from '../../../../../types/interfaces/Show';

@Component({
  selector: 'app-shows-page',
  templateUrl: './shows.component.html',
  styleUrls: ['./shows.component.scss'],
})
export class ShowsComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  shows: ShowInfo[] = [];
  isLoading = new Subject<boolean>();

  constructor(public showService: ShowService, public tmdbService: TmdbService) {}

  ngOnInit(): void {
    this.subscriptions = [
      this.showService
        .getShowsFilteredAndSorted$()
        .pipe(tap(() => this.isLoading.next(true)))
        .subscribe({
          next: async (shows: ShowInfo[]) => {
            this.shows = shows;
            await wait();
            this.isLoading.next(false);
          },
          error: () => this.isLoading.next(false),
        }),
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}

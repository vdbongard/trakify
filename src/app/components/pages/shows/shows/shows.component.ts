import { Component, OnInit } from '@angular/core';
import { Subject, takeUntil, tap } from 'rxjs';
import { ShowService } from '../../../../services/show.service';
import { TmdbService } from '../../../../services/tmdb.service';
import { wait } from '../../../../helper/wait';
import { ShowInfo } from '../../../../../types/interfaces/Show';
import { DialogService } from '../../../../services/dialog.service';
import { BaseComponent } from '../../../../helper/base-component';

@Component({
  selector: 'app-shows-page',
  templateUrl: './shows.component.html',
  styleUrls: ['./shows.component.scss'],
})
export class ShowsComponent extends BaseComponent implements OnInit {
  shows: ShowInfo[] = [];
  isLoading = new Subject<boolean>();

  constructor(
    public showService: ShowService,
    public tmdbService: TmdbService,
    public dialogService: DialogService
  ) {
    super();
  }

  ngOnInit(): void {
    this.showService
      .getShowsFilteredAndSorted$()
      .pipe(
        tap(() => this.isLoading.next(true)),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: async (shows: ShowInfo[]) => {
          this.shows = shows;
          await wait();
          this.isLoading.next(false);
        },
        error: () => this.isLoading.next(false),
      });
  }
}

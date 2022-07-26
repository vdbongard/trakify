import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, takeUntil } from 'rxjs';
import { TmdbService } from '../../../../services/tmdb.service';
import { ShowInfo } from '../../../../../types/interfaces/Show';
import { DialogService } from '../../../../services/dialog.service';
import { BaseComponent } from '../../../../helper/base-component';
import { LoadingState } from '../../../../../types/enum';
import { wait } from '../../../../helper/wait';
import { InfoService } from '../../../../services/info.service';
import { ShowService } from '../../../../services/show.service';

@Component({
  selector: 'app-shows-page',
  templateUrl: './shows.component.html',
  styleUrls: ['./shows.component.scss'],
})
export class ShowsComponent extends BaseComponent implements OnInit {
  loadingState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  shows: ShowInfo[] = [];

  constructor(
    public showService: ShowService,
    public infoService: InfoService,
    public tmdbService: TmdbService,
    public dialogService: DialogService
  ) {
    super();
  }

  ngOnInit(): void {
    this.infoService
      .getShowsFilteredAndSorted$()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (shows: ShowInfo[]) => {
          this.shows = shows;
          this.loadingState.next(LoadingState.SUCCESS);
          await wait(); // fix ink bar not visible at first
        },
        error: () => this.loadingState.next(LoadingState.ERROR),
      });
  }
}

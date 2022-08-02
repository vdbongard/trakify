import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, takeUntil } from 'rxjs';
import { TmdbService } from '../../../../services/tmdb.service';
import { ShowInfo } from '../../../../../types/interfaces/Show';
import { DialogService } from '../../../../services/dialog.service';
import { BaseComponent } from '../../../../helper/base-component';
import { LoadingState } from '../../../../../types/enum';
import { wait } from '../../../../helper/wait';
import { InfoService } from '../../../../services/info.service';
import { ShowService } from '../../../../services/trakt/show.service';
import { onError } from '../../../../helper/error';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-shows-page',
  templateUrl: './shows.component.html',
  styleUrls: ['./shows.component.scss'],
})
export class ShowsComponent extends BaseComponent implements OnInit {
  loadingState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  showsInfos: ShowInfo[] = [];

  constructor(
    public showService: ShowService,
    public infoService: InfoService,
    public tmdbService: TmdbService,
    public dialogService: DialogService,
    private snackBar: MatSnackBar
  ) {
    super();
  }

  ngOnInit(): void {
    this.infoService
      .getShowsFilteredAndSorted$()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (shows: ShowInfo[]) => {
          this.loadingState.next(LoadingState.SUCCESS);
          this.showsInfos = shows;
          await wait(); // fix ink bar not visible at first
        },
        error: (error) => onError(error, this.snackBar, this.loadingState),
      });
  }
}

import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, takeUntil } from 'rxjs';
import { TmdbService } from '../../../../../../shared/services/tmdb.service';
import { ShowInfo } from '../../../../../../../types/interfaces/Show';
import { DialogService } from '../../../../../../shared/services/dialog.service';
import { BaseComponent } from '../../../../../../shared/helper/base-component';
import { LoadingState } from '../../../../../../../types/enum';
import { wait } from '../../../../../../shared/helper/wait';
import { InfoService } from '../../../../../../shared/services/info.service';
import { ShowService } from '../../../../../../shared/services/trakt/show.service';
import { onError } from '../../../../../../shared/helper/error';
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

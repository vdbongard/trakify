import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, takeUntil } from 'rxjs';

import { TmdbService } from '../../../shared/services/tmdb.service';
import { DialogService } from '../../../shared/services/dialog.service';
import { BaseComponent } from '../../../shared/helper/base-component';
import { InfoService } from '../../../shared/services/info.service';
import { ShowService } from '../../../shared/services/trakt/show.service';
import { onError } from '../../../shared/helper/error';
import { ListService } from 'src/app/shared/services/trakt/list.service';
import { ExecuteService } from '../../../shared/services/execute.service';

import { LoadingState } from '../../../../types/enum';

import type { ShowInfo } from '../../../../types/interfaces/Show';

@Component({
  selector: 't-shows-page',
  templateUrl: './shows.component.html',
  styleUrls: ['./shows.component.scss'],
})
export class ShowsComponent extends BaseComponent implements OnInit {
  loadingState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  showsInfos?: ShowInfo[];

  constructor(
    public showService: ShowService,
    public infoService: InfoService,
    public tmdbService: TmdbService,
    public dialogService: DialogService,
    private snackBar: MatSnackBar,
    public listService: ListService,
    public executeService: ExecuteService
  ) {
    super();
  }

  ngOnInit(): void {
    this.infoService
      .getShowsFilteredAndSorted$()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (showsInfos: ShowInfo[]) => {
          this.loadingState.next(LoadingState.SUCCESS);
          this.showsInfos = showsInfos;
        },
        error: (error) => onError(error, this.snackBar, this.loadingState),
      });
  }
}

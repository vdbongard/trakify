import { Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, takeUntil } from 'rxjs';

import { BaseComponent } from '@helper/base-component';
import { TmdbService } from '@services/tmdb.service';
import { DialogService } from '@services/dialog.service';
import { InfoService } from '@services/info.service';
import { ShowService } from '@services/trakt/show.service';
import { ListService } from '@services/trakt/list.service';
import { ExecuteService } from '@services/execute.service';

import { LoadingState } from '@type/enum';

import type { ShowInfo } from '@type/interfaces/Show';
import { ActivatedRoute } from '@angular/router';
import { onError } from '@helper/error';

@Component({
  selector: 't-shows-page',
  templateUrl: './shows.component.html',
  styleUrls: ['./shows.component.scss'],
})
export class ShowsComponent extends BaseComponent implements OnInit {
  pageState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  showsInfos?: ShowInfo[];

  constructor(
    public showService: ShowService,
    public infoService: InfoService,
    public tmdbService: TmdbService,
    public dialogService: DialogService,
    private snackBar: MatSnackBar,
    public listService: ListService,
    public executeService: ExecuteService,
    private activatedRoute: ActivatedRoute
  ) {
    super();
  }

  ngOnInit(): void {
    this.activatedRoute.data.pipe(takeUntil(this.destroy$)).subscribe(({ showInfos }) => {
      this.showsInfos = showInfos;
    });

    this.infoService
      .getShowsFilteredAndSorted$()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (showsInfos: ShowInfo[]) => {
          this.pageState.next(LoadingState.SUCCESS);
          this.showsInfos = showsInfos;
          console.debug('showsInfos', this.showsInfos);
        },
        error: (error) => onError(error, this.snackBar, this.pageState),
      });
  }
}

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
import { ActivatedRoute, Router } from '@angular/router';
import { onError } from '@helper/error';
import * as Paths from 'src/app/paths';
import { AuthService } from '@services/auth.service';

@Component({
  selector: 't-shows-page',
  templateUrl: './shows-progress.component.html',
  styleUrls: ['./shows-progress.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowsProgressComponent extends BaseComponent implements OnInit {
  pageState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  showsInfos?: ShowInfo[];
  paths = Paths;

  constructor(
    public showService: ShowService,
    public infoService: InfoService,
    public tmdbService: TmdbService,
    public dialogService: DialogService,
    private snackBar: MatSnackBar,
    public listService: ListService,
    public executeService: ExecuteService,
    private activatedRoute: ActivatedRoute,
    public router: Router,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
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
          this.cdr.markForCheck();
        },
        error: (error) => onError(error, this.snackBar, this.pageState),
      });
  }
}

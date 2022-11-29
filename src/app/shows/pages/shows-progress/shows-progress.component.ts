import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, takeUntil } from 'rxjs';

import { Base } from '@helper/base';
import { TmdbService } from '../../data/tmdb.service';
import { DialogService } from '@services/dialog.service';
import { InfoService } from '../../data/info.service';
import { ShowService } from '../../data/show.service';
import { ListService } from '../../../lists/data/list.service';
import { ExecuteService } from '@services/execute.service';

import { LoadingState } from '@type/enum';

import type { ShowInfo } from '@type/interfaces/Show';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { onError } from '@helper/error';
import * as Paths from '@shared/paths';
import { AuthService } from '@services/auth.service';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { ShowsComponent } from '@shared/components/shows/shows.component';
import { AsyncPipe, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { NgGenericPipeModule } from 'ng-generic-pipe';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 't-shows-page',
  templateUrl: './shows-progress.component.html',
  styleUrls: ['./shows-progress.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NgIf,
    LoadingComponent,
    ShowsComponent,
    AsyncPipe,
    MatButtonModule,
    RouterLink,
    NgGenericPipeModule,
    MatMenuModule,
    MatIconModule,
  ],
})
export class ShowsProgressComponent extends Base implements OnInit {
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
      this.cdr.markForCheck();
      this.showsInfos = showInfos;
    });

    this.infoService
      .getShowsFilteredAndSorted$()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async (showsInfos: ShowInfo[]) => {
          this.cdr.markForCheck();
          this.pageState.next(LoadingState.SUCCESS);
          this.showsInfos = showsInfos;
          console.debug('showsInfos', this.showsInfos);
        },
        error: (error) => onError(error, this.snackBar, this.pageState),
      });
  }
}

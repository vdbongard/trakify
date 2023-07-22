import { Component, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject } from 'rxjs';
import { TmdbService } from '../../data/tmdb.service';
import { DialogService } from '@services/dialog.service';
import { InfoService } from '../../data/info.service';
import { ShowService } from '../../data/show.service';
import { ListService } from '../../../lists/data/list.service';
import { ExecuteService } from '@services/execute.service';
import { LoadingState } from '@type/Enum';
import type { ShowInfo } from '@type/Show';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { onError } from '@helper/error';
import * as Paths from '@shared/paths';
import { AuthService } from '@services/auth.service';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { ShowsComponent } from '@shared/components/shows/shows.component';
import { AsyncPipe, CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { NgGenericPipeModule } from 'ng-generic-pipe';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 't-shows-page',
  templateUrl: './shows-progress.component.html',
  styleUrls: ['./shows-progress.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
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
export default class ShowsProgressComponent {
  showService = inject(ShowService);
  infoService = inject(InfoService);
  tmdbService = inject(TmdbService);
  dialogService = inject(DialogService);
  snackBar = inject(MatSnackBar);
  listService = inject(ListService);
  executeService = inject(ExecuteService);
  route = inject(ActivatedRoute);
  router = inject(Router);
  authService = inject(AuthService);

  pageState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  showsInfos?: ShowInfo[];
  paths = Paths;

  constructor() {
    this.route.data.pipe(takeUntilDestroyed()).subscribe((data) => {
      this.showsInfos = data['showInfos'] as ShowInfo[];
    });

    this.infoService
      .getShowsFilteredAndSorted$()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (showsInfos: ShowInfo[]) => {
          this.pageState.next(LoadingState.SUCCESS);
          this.showsInfos = showsInfos;
          console.debug('showsInfos', this.showsInfos);
        },
        error: (error) => onError(error, this.snackBar, [this.pageState]),
      });
  }
}

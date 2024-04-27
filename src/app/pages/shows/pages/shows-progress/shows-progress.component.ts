import { Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@services/auth.service';
import { DialogService } from '@services/dialog.service';
import { ExecuteService } from '@services/execute.service';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { ShowsComponent } from '@shared/components/shows/shows.component';
import * as Paths from '@shared/paths';
import { LoadingState } from '@type/Enum';
import { ListService } from '../../../lists/data/list.service';
import { InfoService } from '../../data/info.service';
import { ShowService } from '../../data/show.service';
import { TmdbService } from '../../data/tmdb.service';

@Component({
  selector: 't-shows-page',
  standalone: true,
  imports: [
    LoadingComponent,
    ShowsComponent,
    MatButtonModule,
    RouterLink,
    MatMenuModule,
    MatIconModule,
  ],
  templateUrl: './shows-progress.component.html',
  styleUrl: './shows-progress.component.scss',
})
export default class ShowsProgressComponent {
  showService = inject(ShowService);
  infoService = inject(InfoService);
  tmdbService = inject(TmdbService);
  dialogService = inject(DialogService);
  snackBar = inject(MatSnackBar);
  listService = inject(ListService);
  executeService = inject(ExecuteService);
  router = inject(Router);
  authService = inject(AuthService);

  pageState = signal(LoadingState.LOADING);
  showsInfos = toSignal(this.infoService.getShowsFilteredAndSorted$());
  protected readonly Paths = Paths;

  constructor() {
    effect(
      () => {
        const showInfos = this.showsInfos();
        this.pageState.set(!showInfos ? LoadingState.LOADING : LoadingState.SUCCESS);
        console.debug('showsInfos', showInfos);
      },
      { allowSignalWrites: true },
    );
  }
}

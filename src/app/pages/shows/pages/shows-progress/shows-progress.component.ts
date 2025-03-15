import { Component, computed, effect, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TmdbService } from '../../data/tmdb.service';
import { InfoService } from '../../data/info.service';
import { ShowService } from '../../data/show.service';
import { LoadingState } from '@type/Enum';
import { Router, RouterLink } from '@angular/router';
import * as Paths from '@shared/paths';
import { AuthService } from '@services/auth.service';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { ShowsComponent } from '@shared/components/shows/shows.component';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { ShowItemMenuComponent } from './show-item-menu/show-item-menu.component';

@Component({
  selector: 't-shows-page',
  imports: [
    LoadingComponent,
    ShowsComponent,
    MatButtonModule,
    RouterLink,
    MatMenuModule,
    MatIconModule,
    ShowItemMenuComponent,
  ],
  templateUrl: './shows-progress.component.html',
  styleUrl: './shows-progress.component.scss',
})
export default class ShowsProgressComponent {
  showService = inject(ShowService);
  infoService = inject(InfoService);
  tmdbService = inject(TmdbService);
  snackBar = inject(MatSnackBar);
  router = inject(Router);
  authService = inject(AuthService);

  showsInfos = this.infoService.getShowsFilteredAndSorted();
  // showsInfos = toSignal(this.infoService.getShowsFilteredAndSorted$());
  pageState = computed(() => (!this.showsInfos() ? LoadingState.LOADING : LoadingState.SUCCESS));

  protected readonly Paths = Paths;

  constructor() {
    effect(() => console.debug('showsInfos', this.showsInfos()));
  }
}

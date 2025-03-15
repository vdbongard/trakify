import { Component, computed, effect, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TmdbService } from '../../data/tmdb.service';
import { InfoService } from '../../data/info.service';
import { ShowService } from '../../data/show.service';
import { Router, RouterLink } from '@angular/router';
import * as Paths from '@shared/paths';
import { AuthService } from '@services/auth.service';
import { ShowsComponent } from '@shared/components/shows/shows.component';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { ShowItemMenuComponent } from './show-item-menu/show-item-menu.component';

@Component({
  selector: 't-shows-page',
  imports: [
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
  shows = computed(() => this.showsInfos().map((showInfo) => showInfo.show));

  protected readonly Paths = Paths;

  constructor() {
    effect(() => console.debug('showsInfos', this.showsInfos()));
  }

  tmdbShowQueries = this.tmdbService.getTmdbShowQueries(this.shows);

  showInfosList = computed(() => {
    const showsInfos = this.showsInfos();
    const tmdbShowData = this.tmdbShowQueries().map((query) => query.data);
    const showsInfosWithTmdb = showsInfos.map((show) => {
      const i = tmdbShowData.findIndex((t) => t?.[1]?.traktId === show.show.ids.trakt);
      const tmdbShow = tmdbShowData[i]?.[0];
      return { ...show, tmdbShow };
    });
    return showsInfosWithTmdb;
  });
}

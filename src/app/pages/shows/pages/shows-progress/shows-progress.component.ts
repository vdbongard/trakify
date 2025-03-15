import { ChangeDetectionStrategy, Component, computed, effect, inject } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class ShowsProgressComponent {
  showService = inject(ShowService);
  infoService = inject(InfoService);
  tmdbService = inject(TmdbService);
  router = inject(Router);
  authService = inject(AuthService);

  showsInfosWithoutTmdb = this.infoService.getShowsFilteredAndSorted();

  shows = computed(() => this.showsInfosWithoutTmdb().map((showInfo) => showInfo.show));

  tmdbShowQueries = this.tmdbService.getTmdbShowQueries(this.shows);

  showsInfos = this.tmdbService.getShowsInfosWithTmdb(
    this.tmdbShowQueries,
    this.showsInfosWithoutTmdb,
  );

  protected readonly Paths = Paths;

  constructor() {
    effect(() => console.debug('showsInfos', this.showsInfos()));
  }
}

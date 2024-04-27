import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterLink } from '@angular/router';
import { episodeId } from '@helper/episodeId';
import { onError } from '@helper/error';
import { sortShows } from '@helper/shows';
import { ExecuteService } from '@services/execute.service';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { ShowsComponent } from '@shared/components/shows/shows.component';
import * as Paths from '@shared/paths';
import type { Config } from '@type/Config';
import { LoadingState, Sort } from '@type/Enum';
import type { ShowInfo } from '@type/Show';
import { combineLatest } from 'rxjs';
import { ListService } from '../../../lists/data/list.service';
import { EpisodeService } from '../../data/episode.service';
import { TmdbService } from '../../data/tmdb.service';

@Component({
  selector: 't-watchlist',
  standalone: true,
  imports: [
    MatMenuModule,
    LoadingComponent,
    ShowsComponent,
    MatButtonModule,
    RouterLink,
    MatIconModule,
  ],
  templateUrl: './watchlist.component.html',
  styleUrl: './watchlist.component.scss',
})
export default class WatchlistComponent {
  tmdbService = inject(TmdbService);
  listService = inject(ListService);
  snackBar = inject(MatSnackBar);
  episodeService = inject(EpisodeService);
  executeService = inject(ExecuteService);
  router = inject(Router);

  pageState = signal(LoadingState.LOADING);
  showsInfos?: ShowInfo[];
  protected readonly Paths = Paths;

  constructor() {
    combineLatest([
      this.listService.getWatchlistItems$(),
      this.tmdbService.getTmdbShows$(),
      this.episodeService.getEpisodes$(),
    ])
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: ([watchlistItems, tmdbShows, showsEpisodes]) => {
          const showsInfos = watchlistItems.map((watchlistItem) => ({
            show: watchlistItem.show,
            tmdbShow: watchlistItem.show.ids.tmdb
              ? tmdbShows[watchlistItem.show.ids.tmdb]
              : undefined,
            isWatchlist: true,
            nextEpisode: showsEpisodes[episodeId(watchlistItem.show.ids.trakt, 1, 1)],
          }));

          sortShows(
            { sort: { by: Sort.OLDEST_EPISODE }, sortOptions: [{}] } as Config,
            showsInfos,
            showsEpisodes,
          );

          this.showsInfos = showsInfos;
          console.debug('showsInfos', this.showsInfos);
          this.pageState.set(LoadingState.SUCCESS);
        },
        error: (error) => onError(error, this.snackBar, [this.pageState]),
      });
  }
}

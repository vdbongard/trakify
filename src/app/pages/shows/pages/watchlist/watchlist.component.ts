import { Component, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { combineLatest } from 'rxjs';
import { TmdbService } from '../../data/tmdb.service';
import { ListService } from '../../../lists/data/list.service';
import { EpisodeService } from '../../data/episode.service';
import { ExecuteService } from '@services/execute.service';
import { onError } from '@helper/error';
import { episodeId } from '@helper/episodeId';
import { sortShows } from '@helper/shows';
import { LoadingState, Sort } from '@type/Enum';
import type { ShowInfo } from '@type/Show';
import type { Config } from '@type/Config';
import * as Paths from '@shared/paths';
import { Router, RouterLink } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { ShowsComponent } from '@shared/components/shows/shows.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 't-watchlist',
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

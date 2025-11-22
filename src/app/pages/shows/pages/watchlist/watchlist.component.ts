import { Component, inject, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { combineLatest, map, Observable, of, switchMap, take } from 'rxjs';
import { TmdbService } from '../../data/tmdb.service';
import { ListService } from '../../../lists/data/list.service';
import { EpisodeService } from '../../data/episode.service';
import { ExecuteService } from '@services/execute.service';
import { onError } from '@helper/error';
import { toEpisodeId } from '@helper/toShowId';
import { sortShows } from '@helper/shows';
import { Sort } from '@type/Enum';
import { LoadingState } from '@type/Loading';
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
import { TmdbShow } from '@type/Tmdb';
import { Show } from '@type/Trakt';

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

  pageState = signal<LoadingState>('loading');
  showsInfos?: ShowInfo[];
  protected readonly Paths = Paths;

  constructor() {
    combineLatest([this.listService.getWatchlistItems$(), this.episodeService.getEpisodes$()])
      .pipe(
        switchMap(([watchlistItems, showsEpisodes]) => {
          const showsInfos: ShowInfo[] = watchlistItems.map((watchlistItem) => ({
            show: watchlistItem.show,
            isWatchlist: true,
            nextEpisode: showsEpisodes[toEpisodeId(watchlistItem.show.ids.trakt, 1, 1)],
          }));
          return of({ showsInfos, showsEpisodes });
        }),
        switchMap(({ showsInfos, showsEpisodes }) => {
          const shows = showsInfos.map((showInfo) => showInfo.show);
          return this.getTmdbShows$(shows).pipe(
            map((tmdbShows) => {
              showsInfos.forEach((showInfo, index) => {
                showInfo.tmdbShow = tmdbShows[index];
              });
              return { showsInfos, showsEpisodes };
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe({
        next: ({ showsInfos, showsEpisodes }) => {
          sortShows(
            { sort: { by: Sort.OLDEST_EPISODE }, sortOptions: [{}] } as Config,
            showsInfos,
            showsEpisodes,
          );

          this.showsInfos = showsInfos;
          console.debug('showsInfos', this.showsInfos);
          this.pageState.set('success');
        },
        error: (error) => onError(error, this.snackBar, [this.pageState]),
      });
  }

  getTmdbShows$(shows: Show[]): Observable<TmdbShow[]> {
    return combineLatest(
      shows.map((show) => this.tmdbService.getTmdbShow$(show, false, { fetchAlways: true })),
    ).pipe(take(1));
  }
}

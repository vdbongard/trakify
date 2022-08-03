import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, Subscription, takeUntil } from 'rxjs';
import { ShowInfo } from '../../../../types/interfaces/Show';
import { ShowService } from '../../../services/trakt/show.service';
import { TmdbService } from '../../../services/tmdb.service';
import { ListService } from '../../../services/trakt/list.service';
import { BaseComponent } from '../../../helper/base-component';
import { LoadingState, Sort } from '../../../../types/enum';
import { onError } from '../../../helper/error';
import { MatSnackBar } from '@angular/material/snack-bar';
import { EpisodeService } from '../../../services/trakt/episode.service';
import { episodeId } from '../../../helper/episodeId';
import { sortShows } from '../../../helper/shows';
import { ConfigService } from '../../../services/config.service';
import { Config } from '../../../../types/interfaces/Config';

@Component({
  selector: 'app-watchlist',
  templateUrl: './watchlist.component.html',
  styleUrls: ['./watchlist.component.scss'],
})
export class WatchlistComponent extends BaseComponent implements OnInit {
  loadingState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  showsInfos?: ShowInfo[];

  constructor(
    public showService: ShowService,
    public tmdbService: TmdbService,
    public listService: ListService,
    private snackBar: MatSnackBar,
    private episodeService: EpisodeService,
    private configService: ConfigService
  ) {
    super();
  }

  ngOnInit(): void {
    this.listService.updated.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.getWatchlist();
      },
      error: (error) => onError(error, this.snackBar, this.loadingState),
    });
  }

  getWatchlist(): Subscription {
    return combineLatest([
      this.listService.getWatchlistItems$(),
      this.tmdbService.tmdbShows$,
      this.episodeService.getEpisodes$(),
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: async ([watchlistItems, tmdbShows, showsEpisodes]) => {
          const showsInfos = watchlistItems.map((watchlistItem) => ({
            show: watchlistItem.show,
            tmdbShow: tmdbShows[watchlistItem.show.ids.tmdb],
            isWatchlist: true,
            nextEpisode: showsEpisodes[episodeId(watchlistItem.show.ids.trakt, 1, 1)],
          }));

          sortShows(
            { sort: { by: Sort.NEWEST_EPISODE }, sortOptions: [{}] } as Config,
            showsInfos,
            showsEpisodes
          );
          showsInfos.reverse(); // show oldest first episode first

          this.showsInfos = showsInfos;
          this.loadingState.next(LoadingState.SUCCESS);
        },
        error: (error) => onError(error, this.snackBar, this.loadingState),
      });
  }
}

import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { BehaviorSubject, catchError, of, switchMap, take, takeUntil } from 'rxjs';
import { TmdbService } from '../../../../services/tmdb.service';
import { ShowService } from '../../../../services/trakt/show.service';
import { SyncService } from '../../../../services/sync.service';
import { ShowInfo } from '../../../../../types/interfaces/Show';
import { BaseComponent } from '../../../../helper/base-component';
import { EpisodeService } from '../../../../services/trakt/episode.service';
import { InfoService } from '../../../../services/info.service';
import { LoadingState } from '../../../../../types/enum';
import { MatSnackBar } from '@angular/material/snack-bar';
import { onError } from '../../../../helper/error';

@Component({
  selector: 'app-show',
  templateUrl: './show.component.html',
  styleUrls: ['./show.component.scss'],
})
export class ShowComponent extends BaseComponent implements OnInit {
  loadingState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  showInfo?: ShowInfo;
  posterPrefix?: string;
  stillPrefix?: string;
  params?: Params;

  constructor(
    private route: ActivatedRoute,
    private showService: ShowService,
    public syncService: SyncService,
    private tmdbService: TmdbService,
    private episodeService: EpisodeService,
    private infoService: InfoService,
    private snackBar: MatSnackBar
  ) {
    super();
  }

  ngOnInit(): void {
    this.route.params
      .pipe(
        switchMap((params) => {
          this.params = params;
          return this.infoService.getShowInfo$(params['slug']);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (showInfo) => {
          this.showInfo = showInfo;
          this.loadingState.next(LoadingState.SUCCESS);
        },
        error: (error) => onError(error, this.snackBar, this.loadingState),
      });

    this.tmdbService.tmdbConfig$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (tmdbConfig) => {
        if (!tmdbConfig) return;
        this.stillPrefix = tmdbConfig.images.secure_base_url + tmdbConfig.images.still_sizes[3];
        this.posterPrefix = tmdbConfig.images.secure_base_url + tmdbConfig.images.poster_sizes[2];
      },
      error: (error) => onError(error, this.snackBar, this.loadingState),
    });
  }

  addToHistory(showInfo: ShowInfo): void {
    this.setNextEpisode(showInfo);
    this.syncService.syncAddToHistory(showInfo.show?.ids, showInfo.nextEpisode);
  }

  setNextEpisode(showInfo: ShowInfo): void {
    if (!showInfo.show) return;

    const episode = showInfo.nextEpisode;
    if (episode) {
      this.showService.setNextEpisode(showInfo.show?.ids.trakt, null);
      this.episodeService
        .getEpisode$(showInfo.show.ids, episode.season, episode.number + 1, true, true)
        .pipe(
          catchError(() => {
            if (!showInfo.show) return of(undefined);
            return this.episodeService.getEpisode$(
              showInfo.show.ids,
              episode.season + 1,
              1,
              true,
              true
            );
          }),
          take(1)
        )
        .subscribe({
          next: (nextEpisode) =>
            this.showService.setNextEpisode(showInfo.show?.ids.trakt, nextEpisode),
          error: () => this.showService.setNextEpisode(showInfo.show?.ids.trakt, null),
        });
    } else {
      this.showService.setNextEpisode(showInfo.show.ids.trakt, null);
    }
  }
}

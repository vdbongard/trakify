import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  Observable,
  of,
  switchMap,
  takeUntil,
} from 'rxjs';
import { TmdbService } from '../../../../../shared/services/tmdb.service';
import { ShowService } from '../../../../../shared/services/trakt/show.service';
import { SyncService } from '../../../../../shared/services/sync.service';
import { ShowInfo } from '../../../../../../types/interfaces/Show';
import { BaseComponent } from '../../../../../shared/helper/base-component';
import { EpisodeService } from '../../../../../shared/services/trakt/episode.service';
import { InfoService } from '../../../../../shared/services/info.service';
import { LoadingState } from '../../../../../../types/enum';
import { MatSnackBar } from '@angular/material/snack-bar';
import { onError } from '../../../../../shared/helper/error';
import {
  EpisodeFull,
  ShowProgress,
  ShowWatched,
  TraktShow,
} from '../../../../../../types/interfaces/Trakt';
import { TmdbEpisode, TmdbShow } from '../../../../../../types/interfaces/Tmdb';

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
  posterLoaded = false;

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
          if (!params['slug']) throw Error('Slug is empty');
          this.params = params;
          return this.showService.getIdsBySlug$(params['slug'], true);
        }),
        switchMap((ids) => {
          if (!ids) throw Error('Ids is empty');
          console.debug('ids', ids);
          return combineLatest([
            this.showService.getShow$(ids, false, true),
            this.showService.getShowWatched$(ids.trakt),
            this.showService.getShowProgress$(ids.trakt),
            this.tmdbService.getTmdbShow$(ids, false, true),
            of(ids),
          ]);
        }),
        switchMap(([show, showWatched, showProgress, tmdbShow, ids]) => {
          if (!show) throw Error('Show is empty');

          this.loadingState.next(LoadingState.SUCCESS);

          this.showInfo = {
            show,
            tmdbShow,
            showWatched,
            showProgress: showProgress
              ? { ...showProgress, seasons: [...showProgress.seasons].reverse() }
              : undefined,
          };
          return combineLatest([
            this.getNextEpisode(tmdbShow, showProgress, showWatched, show),
            of(ids),
          ]);
        }),
        switchMap(([[nextEpisode, tmdbNextEpisode], ids]) => {
          this.showInfo = { ...this.showInfo, nextEpisode, tmdbNextEpisode };
          return nextEpisode
            ? this.tmdbService.getTmdbSeason$(ids, nextEpisode.season, false, true)
            : of(undefined);
        }),
        switchMap((tmdbSeason) => {
          this.showInfo = { ...this.showInfo, tmdbSeason };
          console.debug('showInfo', this.showInfo);
          return of(undefined);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
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

  private getNextEpisode(
    tmdbShow: TmdbShow | undefined,
    showProgress: ShowProgress | undefined,
    showWatched: ShowWatched | undefined,
    show: TraktShow
  ): Observable<[EpisodeFull | null | undefined, TmdbEpisode | null | undefined]> {
    const isShowEnded = tmdbShow ? ['Ended', 'Canceled'].includes(tmdbShow.status) : false;

    const seasonNumber: number | null | undefined =
      showProgress && showProgress?.next_episode !== null
        ? showProgress?.next_episode?.season
        : isShowEnded && showWatched
        ? null
        : 1;
    const episodeNumber: number | null | undefined =
      showProgress && showProgress?.next_episode !== null
        ? showProgress?.next_episode?.number
        : isShowEnded && showWatched
        ? null
        : 1;

    const areNextEpisodesNumbersSet =
      seasonNumber !== undefined &&
      episodeNumber !== undefined &&
      seasonNumber !== null &&
      episodeNumber !== null;

    if (areNextEpisodesNumbersSet) {
      this.showInfo = {
        ...this.showInfo,
        nextEpisodeProgress: showProgress?.seasons
          .find((season) => season.number === seasonNumber)
          ?.episodes?.find((episode) => episode.number === episodeNumber),
      };
    }

    return combineLatest([
      areNextEpisodesNumbersSet
        ? this.episodeService.getEpisode$(show.ids, seasonNumber, episodeNumber, false, true)
        : of(seasonNumber as undefined | null),
      areNextEpisodesNumbersSet
        ? this.tmdbService
            .getTmdbEpisode$(show.ids.tmdb, seasonNumber, episodeNumber, false, true)
            .pipe(catchError(() => of(undefined)))
        : of(seasonNumber as undefined | null),
    ]);
  }

  addToHistory(showInfo: ShowInfo): void {
    try {
      this.episodeService.setNextEpisode(showInfo, true, true);
      this.syncService.syncAddEpisode(showInfo.nextEpisode, showInfo.show?.ids);
    } catch (error) {
      onError(error as Error, this.snackBar);
    }
  }
}

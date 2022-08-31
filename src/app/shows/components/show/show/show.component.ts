import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  map,
  Observable,
  of,
  switchMap,
  takeUntil,
} from 'rxjs';
import { TmdbService } from '../../../../shared/services/tmdb.service';
import { ShowService } from '../../../../shared/services/trakt/show.service';
import { ShowInfo } from '../../../../../types/interfaces/Show';
import { BaseComponent } from '../../../../shared/helper/base-component';
import { EpisodeService } from '../../../../shared/services/trakt/episode.service';
import { InfoService } from '../../../../shared/services/info.service';
import { LoadingState } from '../../../../../types/enum';
import { MatSnackBar } from '@angular/material/snack-bar';
import { onError } from '../../../../shared/helper/error';
import {
  EpisodeFull,
  Show,
  ShowProgress,
  ShowWatched,
} from '../../../../../types/interfaces/Trakt';
import { TmdbEpisode, TmdbShow } from '../../../../../types/interfaces/Tmdb';
import { ExecuteService } from '../../../../shared/services/execute.service';
import { SM } from '../../../../shared/constants';
import { BreakpointObserver } from '@angular/cdk/layout';

@Component({
  selector: 't-show',
  templateUrl: './show.component.html',
  styleUrls: ['./show.component.scss'],
})
export class ShowComponent extends BaseComponent implements OnInit, OnDestroy {
  loadingState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  seenLoading = new BehaviorSubject<LoadingState>(LoadingState.SUCCESS);
  loadingStateEnum = LoadingState;
  showInfo?: ShowInfo;
  posterPrefix?: string;
  stillPrefix?: string;
  params?: ParamMap;
  posterLoaded = false;
  isSmall = false;
  isMoreOverviewShown = false;
  maxSmallOverviewLength = 180;
  maxLargeOverviewLength = 500;

  constructor(
    private route: ActivatedRoute,
    public showService: ShowService,
    private tmdbService: TmdbService,
    private episodeService: EpisodeService,
    private infoService: InfoService,
    private snackBar: MatSnackBar,
    public executeService: ExecuteService,
    private observer: BreakpointObserver
  ) {
    super();
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          if (!params.has('slug')) throw Error('Slug is empty');
          this.params = params;
          return this.showService.getIdsBySlug$(params.get('slug'), { fetch: true });
        }),
        switchMap((ids) => {
          if (!ids) throw Error('Ids is empty');
          return combineLatest([
            this.showService.getShow$(ids, { fetchAlways: true }),
            this.showService.getShowWatched$(ids.trakt),
            this.showService.getShowProgress$(ids.trakt),
            this.showService.favorites.$,
            this.tmdbService.getTmdbShow$(ids, { fetchAlways: true }),
            of(ids),
          ]);
        }),
        switchMap(([show, showWatched, showProgress, favorites, tmdbShow, ids]) => {
          if (!show) throw Error('Show is empty');

          this.loadingState.next(LoadingState.SUCCESS);

          this.showInfo = {
            ...this.showInfo,
            show,
            tmdbShow,
            showWatched,
            showProgress: showProgress
              ? { ...showProgress, seasons: [...showProgress.seasons].reverse() }
              : undefined,
            isFavorite: !!favorites?.includes(show.ids.trakt),
          };

          this.showService.activeShow.next(show);

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
        map((tmdbSeason) => {
          this.showInfo = {
            ...this.showInfo,
            tmdbSeason: tmdbSeason ?? this.showInfo?.tmdbSeason,
          };
          console.debug('showInfo', this.showInfo);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({ error: (error) => onError(error, this.snackBar, this.loadingState) });

    this.tmdbService.tmdbConfig.$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (tmdbConfig) => {
        if (!tmdbConfig) return;
        this.stillPrefix = tmdbConfig.images.secure_base_url + tmdbConfig.images.still_sizes[3];
        this.posterPrefix = tmdbConfig.images.secure_base_url + tmdbConfig.images.poster_sizes[2];
      },
      error: (error) => onError(error, this.snackBar, this.loadingState),
    });

    this.observer
      .observe([`(max-width: ${SM})`])
      .pipe(takeUntil(this.destroy$))
      .subscribe((breakpoint) => {
        this.isSmall = breakpoint.matches;
      });
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.showService.activeShow.next(undefined);
  }

  private getNextEpisode(
    tmdbShow: TmdbShow | undefined,
    showProgress: ShowProgress | undefined,
    showWatched: ShowWatched | undefined,
    show: Show
  ): Observable<[EpisodeFull | null | undefined, TmdbEpisode | null | undefined]> {
    const isShowEnded = tmdbShow ? ['Ended', 'Canceled'].includes(tmdbShow.status) : false;

    const seasonNumber: number | null | undefined =
      showProgress && showProgress?.next_episode !== null
        ? showProgress?.next_episode?.season
        : (isShowEnded || showProgress?.next_episode === null) && showWatched
        ? null
        : 1;
    const episodeNumber: number | null | undefined =
      showProgress && showProgress?.next_episode !== null
        ? showProgress?.next_episode?.number
        : (isShowEnded || showProgress?.next_episode === null) && showWatched
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
        ? this.episodeService.getEpisode$(show.ids, seasonNumber, episodeNumber, {
            sync: true,
            fetchAlways: true,
          })
        : of(seasonNumber as undefined | null),
      areNextEpisodesNumbersSet
        ? this.tmdbService
            .getTmdbEpisode$(show.ids.tmdb, seasonNumber, episodeNumber, {
              sync: true,
              fetch: true,
            })
            .pipe(catchError(() => of(undefined)))
        : of(seasonNumber as undefined | null),
    ]);
  }

  addToHistory(showInfo: ShowInfo): void {
    try {
      this.episodeService.setNextEpisode(showInfo, { sync: true, fetch: true }, this.seenLoading);
      this.executeService.addEpisode(showInfo.nextEpisode, showInfo.show?.ids);
    } catch (error) {
      onError(error, this.snackBar, this.seenLoading);
    }
  }
}

import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatSnackBar } from '@angular/material/snack-bar';
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

import { TmdbService } from '@services/tmdb.service';
import { ShowService } from '@services/trakt/show.service';
import { BaseComponent } from '@helper/base-component';
import { EpisodeService } from '@services/trakt/episode.service';
import { InfoService } from '@services/info.service';
import { onError } from '@helper/error';
import { ExecuteService } from '@services/execute.service';
import { PosterPrefixLg, SM } from '@constants';

import { LoadingState } from '@type/enum';

import type { ShowInfo } from '@type/interfaces/Show';
import type { Episode, EpisodeFull, Show, ShowProgress, ShowWatched } from '@type/interfaces/Trakt';
import type { TmdbEpisode, TmdbShow } from '@type/interfaces/Tmdb';
import { isShowEnded } from '../../../../shared/pipes/is-show-ended.pipe';

@Component({
  selector: 't-show',
  templateUrl: './show.component.html',
  styleUrls: ['./show.component.scss'],
})
export class ShowComponent extends BaseComponent implements OnInit, OnDestroy {
  pageState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  seenLoading = new BehaviorSubject<LoadingState>(LoadingState.SUCCESS);
  state = LoadingState;
  showInfo?: ShowInfo;
  params?: Params;
  posterLoaded = false;
  isSmall = false;
  isMoreOverviewShown = false;
  maxSmallOverviewLength = 180;
  maxLargeOverviewLength = 500;
  posterPrefix = PosterPrefixLg;

  constructor(
    private route: ActivatedRoute,
    public showService: ShowService,
    private tmdbService: TmdbService,
    private episodeService: EpisodeService,
    private infoService: InfoService,
    private snackBar: MatSnackBar,
    public executeService: ExecuteService,
    private observer: BreakpointObserver,
    private title: Title
  ) {
    super();
  }

  ngOnInit(): void {
    this.route.params
      .pipe(
        switchMap((params) => {
          if (!params['slug']) throw Error('Slug is empty');
          this.params = params;
          return this.showService.getIdsBySlug$(params['slug'], { fetch: true });
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

          this.pageState.next(LoadingState.SUCCESS);
          this.title.setTitle(`${show.title} - Trakify`);

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
      .subscribe({ error: (error) => onError(error, this.snackBar, this.pageState) });

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
    const isEnded = isShowEnded(tmdbShow);

    const seasonNumber: number | null | undefined =
      showProgress && showProgress?.next_episode !== null
        ? showProgress?.next_episode?.season
        : (isEnded || showProgress?.next_episode === null) && showWatched
        ? null
        : 1;
    const episodeNumber: number | null | undefined =
      showProgress && showProgress?.next_episode !== null
        ? showProgress?.next_episode?.number
        : (isEnded || showProgress?.next_episode === null) && showWatched
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

  addToHistory(episode: Episode, show: Show, tmdbShow: TmdbShow): void {
    try {
      this.episodeService.setNextEpisode(
        episode,
        show,
        { sync: true, fetch: true },
        this.seenLoading,
        tmdbShow
      );
      this.executeService.addEpisode(episode, show?.ids);
    } catch (error) {
      onError(error, this.snackBar, this.seenLoading);
    }
  }
}

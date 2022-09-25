import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  BehaviorSubject,
  combineLatest,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  takeUntil,
  tap,
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
import type {
  Episode,
  EpisodeFull,
  EpisodeProgress,
  Show,
  ShowProgress,
  ShowWatched,
} from '@type/interfaces/Trakt';
import type { TmdbEpisode, TmdbSeason, TmdbShow } from '@type/interfaces/Tmdb';
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
  posterLoaded = false;
  isSmall = false;
  isMoreOverviewShown = false;
  maxSmallOverviewLength = 180;
  maxLargeOverviewLength = 500;
  posterPrefix = PosterPrefixLg;

  show$?: Observable<Show>;
  showWatched$?: Observable<ShowWatched | undefined>;
  showProgress$?: Observable<ShowProgress | undefined>;
  tmdbShow$?: Observable<TmdbShow>;
  tmdbSeason$?: Observable<TmdbSeason>;
  isFavorite$?: Observable<boolean>;
  nextEpisode$?: Observable<
    [EpisodeFull | null | undefined, TmdbEpisode | null | undefined, EpisodeProgress | undefined]
  >;

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
    this.show$ = this.route.params.pipe(
      switchMap((params) => this.showService.getShowBySlug$(params['slug'], { fetchAlways: true })),
      shareReplay(),
      tap((show) => {
        this.pageState.next(LoadingState.SUCCESS);
        this.title.setTitle(`${show.title} - Trakify`);
        this.showService.activeShow.next(show);
        console.debug('show', show);
      })
    );

    this.showWatched$ = this.show$.pipe(
      switchMap((show) => this.showService.getShowWatched$(show))
    );

    this.showProgress$ = this.show$.pipe(
      switchMap((show) => this.showService.getShowProgress$(show)),
      map((showProgress) =>
        showProgress
          ? {
              ...showProgress,
              seasons: [...showProgress.seasons].reverse(),
            }
          : undefined
      )
    );

    this.tmdbShow$ = this.show$.pipe(
      switchMap((show) => this.tmdbService.getTmdbShow$(show, { fetchAlways: true })),
      shareReplay()
    );

    this.isFavorite$ = combineLatest([this.show$, this.showService.favorites.$]).pipe(
      map(([show, favorites]) => !!favorites?.includes(show.ids.trakt))
    );

    this.nextEpisode$ = combineLatest([
      this.tmdbShow$,
      this.showProgress$,
      this.showWatched$,
      this.show$,
    ]).pipe(
      switchMap(([tmdbShow, showProgress, showWatched, show]) => {
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

        return combineLatest([
          areNextEpisodesNumbersSet
            ? this.episodeService.getEpisode$(show, seasonNumber, episodeNumber, {
                sync: true,
                fetchAlways: true,
              })
            : of(undefined),
          areNextEpisodesNumbersSet
            ? this.tmdbService.getTmdbEpisode$(show, seasonNumber, episodeNumber, {
                sync: true,
                fetch: true,
              })
            : of(undefined),
          areNextEpisodesNumbersSet
            ? of(
                showProgress?.seasons
                  .find((season) => season.number === seasonNumber)
                  ?.episodes?.find((episode) => episode.number === episodeNumber)
              )
            : of(undefined),
        ]);
      }),
      shareReplay()
    );

    this.tmdbSeason$ = combineLatest([this.show$, this.nextEpisode$]).pipe(
      switchMap(([show, nextEpisode]) =>
        this.tmdbService.getTmdbSeason$(show, nextEpisode[0]?.season, false, true)
      ),
      shareReplay()
    );

    combineLatest([
      this.show$,
      this.showWatched$,
      this.showProgress$,
      this.tmdbShow$,
      this.isFavorite$,
      this.nextEpisode$,
      this.tmdbSeason$,
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (error) => onError(error, this.snackBar, this.pageState),
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

  addToHistory(episode: Episode, show: Show, tmdbShow: TmdbShow): void {
    try {
      this.episodeService.setNextEpisode(
        episode,
        show,
        { sync: true, fetch: true },
        this.seenLoading,
        tmdbShow
      );
      this.executeService.addEpisode(episode, show);
    } catch (error) {
      onError(error, this.snackBar, this.seenLoading);
    }
  }
}

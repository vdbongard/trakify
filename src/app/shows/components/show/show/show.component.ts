import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, combineLatest, map, of, switchMap, takeUntil, tap } from 'rxjs';

import { TmdbService } from '@services/tmdb.service';
import { ShowService } from '@services/trakt/show.service';
import { BaseComponent } from '@helper/base-component';
import { EpisodeService } from '@services/trakt/episode.service';
import { InfoService } from '@services/info.service';
import { onError } from '@helper/error';
import { ExecuteService } from '@services/execute.service';
import { PosterPrefixLg, SM } from '@constants';

import { LoadingState } from '@type/enum';
import { isShowEnded } from '../../../../shared/pipes/is-show-ended.pipe';
import { AddToHistoryParams } from '@type/interfaces/Show';
import { z } from 'zod';
import { catchErrorAndReplay } from '@operator/catchErrorAndReplay';
import { ParamService } from '@services/param.service';

@Component({
  selector: 't-show',
  templateUrl: './show.component.html',
  styleUrls: ['./show.component.scss'],
})
export class ShowComponent extends BaseComponent implements OnInit, OnDestroy {
  pageState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  seenLoading = new BehaviorSubject<LoadingState>(LoadingState.SUCCESS);
  isSmall = false;
  posterPrefix = PosterPrefixLg;

  params$ = this.paramService.params$(this.route.params, paramSchema, this.pageState);

  show$ = this.showService.show$(this.params$, this.pageState).pipe(
    tap((show) => {
      this.pageState.next(LoadingState.SUCCESS);
      this.title.setTitle(`${show.title} - Trakify`);
    })
  );

  showWatched$ = this.show$.pipe(
    switchMap((show) => this.showService.getShowWatched$(show)),
    catchErrorAndReplay('showWatched', this.snackBar, this.pageState)
  );

  showProgress$ = this.show$.pipe(
    switchMap((show) => this.showService.getShowProgress$(show)),
    map((showProgress) => {
      if (!showProgress) return;
      return {
        ...showProgress,
        seasons: [...showProgress.seasons].reverse(),
      };
    }),
    catchErrorAndReplay('showProgress', this.snackBar, this.pageState)
  );

  tmdbShow$ = this.show$.pipe(
    switchMap((show) => this.tmdbService.getTmdbShow$(show, { fetchAlways: true })),
    catchErrorAndReplay(
      'tmdbShow',
      this.snackBar,
      this.pageState,
      'An error occurred while fetching the tmdb show'
    )
  );

  isFavorite$ = combineLatest([this.show$, this.showService.favorites.$]).pipe(
    map(([show, favorites]) => !!favorites?.includes(show.ids.trakt)),
    catchErrorAndReplay('isFavorite', this.snackBar, this.pageState)
  );

  nextEpisode$ = combineLatest([
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
          : of(seasonNumber as undefined | null),
        areNextEpisodesNumbersSet
          ? this.tmdbService.getTmdbEpisode$(show, seasonNumber, episodeNumber, {
              sync: true,
              fetchAlways: true,
            })
          : of(seasonNumber as undefined | null),
        areNextEpisodesNumbersSet
          ? of(
              showProgress?.seasons
                .find((season) => season.number === seasonNumber)
                ?.episodes?.find((episode) => episode.number === episodeNumber)
            )
          : of(seasonNumber as undefined | null),
      ]);
    }),
    catchErrorAndReplay('nextEpisode', this.snackBar, this.pageState)
  );

  tmdbSeason$ = combineLatest([this.show$, this.nextEpisode$]).pipe(
    switchMap(([show, nextEpisode]) => {
      const traktNextEpisode = nextEpisode[0];
      if (!traktNextEpisode) return of(undefined);
      return this.tmdbService.getTmdbSeason$(show, traktNextEpisode.season, false, true);
    }),
    catchErrorAndReplay('tmdbSeason', this.snackBar, this.pageState)
  );

  constructor(
    private route: ActivatedRoute,
    public showService: ShowService,
    private tmdbService: TmdbService,
    private episodeService: EpisodeService,
    private infoService: InfoService,
    private snackBar: MatSnackBar,
    public executeService: ExecuteService,
    private observer: BreakpointObserver,
    private title: Title,
    private paramService: ParamService
  ) {
    super();
  }

  ngOnInit(): void {
    this.observer
      .observe([`(max-width: ${SM})`])
      .pipe(takeUntil(this.destroy$))
      .subscribe((breakpoint) => {
        this.isSmall = breakpoint.matches;
      });
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.showService.activeShow$.next(undefined);
  }

  addToHistory({ episode, show, tmdbShow }: AddToHistoryParams): void {
    if (!episode || !show || !tmdbShow) throw Error('Argument is empty (addToHistory)');
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

const paramSchema = z.object({
  show: z.string(),
});

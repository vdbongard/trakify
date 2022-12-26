import { Component, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  filter,
  map,
  of,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';

import { TmdbService } from '../../data/tmdb.service';
import { ShowService } from '../../data/show.service';
import { Base } from '@helper/base';
import { EpisodeService } from '../../data/episode.service';
import { onError } from '@helper/error';
import { ExecuteService } from '@services/execute.service';
import { SM } from '@constants';

import { LoadingState } from '@type/enum';
import { z } from 'zod';
import { catchErrorAndReplay } from '@operator/catchErrorAndReplay';
import { ParamService } from '@services/param.service';
import { Episode, Show } from '@type/interfaces/Trakt';
import { SeasonService } from '../../data/season.service';
import { ListService } from '../../../lists/data/list.service';
import { AuthService } from '@services/auth.service';
import { DialogService } from '@services/dialog.service';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { ShowHeaderComponent } from '../../ui/show-header/show-header.component';
import { ShowCastComponent } from '../../ui/show-cast/show-cast.component';
import { AsyncPipe, NgIf } from '@angular/common';
import { ShowDetailsComponent } from '../../ui/show-details/show-details.component';
import { ShowNextEpisodeComponent } from '../../ui/show-next-episode/show-next-episode.component';
import { ShowSeasonsComponent } from '../../ui/show-seasons/show-seasons.component';
import { ShowLinksComponent } from '../../ui/show-links/show-links.component';
import { IsErrorPipe } from '@shared/pipes/is-error.pipe';
import { Cast, TmdbShow } from '@type/interfaces/Tmdb';
import { isShowEnded } from '@shared/pipes/is-show-ended.pipe';
import { distinctUntilChangedDeep } from '@operator/distinctUntilChangedDeep';

@Component({
  selector: 't-show',
  templateUrl: './show.component.html',
  styleUrls: ['./show.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    LoadingComponent,
    ShowHeaderComponent,
    ShowCastComponent,
    AsyncPipe,
    ShowDetailsComponent,
    ShowNextEpisodeComponent,
    ShowSeasonsComponent,
    ShowLinksComponent,
    IsErrorPipe,
  ],
})
export class ShowComponent extends Base implements OnDestroy {
  pageState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  seenLoading = new BehaviorSubject<LoadingState>(LoadingState.SUCCESS);
  back = history.state.back;
  cast?: Cast[];

  isSmall$ = this.observer
    .observe([`(max-width: ${SM})`])
    .pipe(map((breakpoint) => breakpoint.matches));

  params$ = this.paramService.params$(this.route.params, paramSchema, [this.pageState]);

  show$ = this.showService.show$(this.params$, [this.pageState]).pipe(
    tap((show) => {
      this.title.setTitle(`${show.title} - Trakify`);
      this.pageState.next(LoadingState.SUCCESS);
    }),
    shareReplay()
  );

  isWatchlist$ = combineLatest([this.show$, this.listService.watchlist.$]).pipe(
    map(
      ([show, watchlistItems]) =>
        !!watchlistItems?.find((watchlistItem) => watchlistItem.show.ids.trakt === show.ids.trakt)
    ),
    catchErrorAndReplay('isWatchlist', this.snackBar, [this.pageState])
  );

  showWatched$ = this.show$.pipe(
    switchMap((show) => this.showService.getShowWatched$(show)),
    catchErrorAndReplay('showWatched', this.snackBar, [this.pageState])
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
    catchErrorAndReplay('showProgress', this.snackBar, [this.pageState])
  );

  tmdbShow$ = this.show$.pipe(
    switchMap((show) => this.tmdbService.getTmdbShow$(show, true, { fetchAlways: true })),
    map((show) => {
      if (!show) return;
      const showWithSpecialsSeasonAtEnd: TmdbShow = { ...show, seasons: [...show.seasons] };
      const season0Index = showWithSpecialsSeasonAtEnd.seasons.findIndex(
        (season) => season.season_number === 0
      );
      if (season0Index >= 0) {
        // push specials season to end of array
        showWithSpecialsSeasonAtEnd.seasons.push(
          showWithSpecialsSeasonAtEnd.seasons.splice(season0Index, 1)[0]
        );
      }
      return showWithSpecialsSeasonAtEnd;
    }),
    tap((tmdbShow) => (this.cast = tmdbShow?.aggregate_credits?.cast)),
    catchErrorAndReplay(
      'tmdbShow',
      this.snackBar,
      [this.pageState],
      'An error occurred while fetching the tmdb show'
    )
  );

  isFavorite$ = combineLatest([this.show$, this.showService.favorites.$]).pipe(
    map(([show, favorites]) => !!favorites?.includes(show.ids.trakt)),
    catchErrorAndReplay('isFavorite', this.snackBar, [this.pageState])
  );

  nextEpisode$ = combineLatest([
    this.tmdbShow$,
    this.showProgress$,
    this.showWatched$,
    this.show$,
  ]).pipe(
    map(([tmdbShow, showProgress, showWatched, show]) => {
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

      return { seasonNumber, episodeNumber, show, showProgress };
    }),
    distinctUntilChangedDeep(),
    switchMap(({ seasonNumber, episodeNumber, show, showProgress }) => {
      const areNextEpisodesNumbersSet =
        seasonNumber !== undefined &&
        episodeNumber !== undefined &&
        seasonNumber !== null &&
        episodeNumber !== null;

      return combineLatest([
        areNextEpisodesNumbersSet
          ? this.episodeService
              .getEpisode$(show, seasonNumber, episodeNumber, {
                sync: true,
                fetchAlways: true,
              })
              .pipe(catchError(() => of(undefined)))
          : of(seasonNumber as undefined | null),
        areNextEpisodesNumbersSet
          ? this.tmdbService
              .getTmdbEpisode$(show, seasonNumber, episodeNumber, {
                sync: true,
                fetchAlways: true,
              })
              .pipe(catchError(() => of(undefined)))
          : of(seasonNumber as undefined | null),
        areNextEpisodesNumbersSet
          ? of(
              showProgress?.seasons
                .find((season) => season.number === seasonNumber)
                ?.episodes?.find((episode) => episode.number === episodeNumber)
            ).pipe(catchError(() => of(undefined)))
          : of(seasonNumber as undefined | null),
      ]);
    }),
    catchErrorAndReplay('nextEpisode', this.snackBar, [this.pageState])
  );

  tmdbSeason$ = combineLatest([this.show$, this.nextEpisode$]).pipe(
    switchMap(([show, nextEpisode]) => {
      const traktNextEpisode = nextEpisode[0];
      if (!traktNextEpisode) return of(undefined);
      return this.tmdbService.getTmdbSeason$(show, traktNextEpisode.season, true, true);
    }),
    catchErrorAndReplay('tmdbSeason', this.snackBar, [this.pageState])
  );

  seasonEpisodes$ = combineLatest([this.tmdbShow$, this.show$]).pipe(
    filter(([tmdbShow]) => !isShowEnded(tmdbShow)),
    switchMap(([tmdbShow, show]) => this.episodeService.fetchEpisodesFromShow(tmdbShow, show)),
    catchErrorAndReplay('seasonEpisodes', this.snackBar, [this.pageState])
  );

  constructor(
    private route: ActivatedRoute,
    public showService: ShowService,
    private tmdbService: TmdbService,
    private episodeService: EpisodeService,
    private snackBar: MatSnackBar,
    public executeService: ExecuteService,
    private observer: BreakpointObserver,
    private title: Title,
    private paramService: ParamService,
    private seasonService: SeasonService,
    private listService: ListService,
    public authService: AuthService,
    public dialogService: DialogService
  ) {
    super();
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.showService.activeShow$.next(undefined);
  }

  async addToHistory(episode: Episode | undefined, show: Show): Promise<void> {
    if (!episode) throw Error('Episode is empty (addToHistory)');
    try {
      await this.executeService.addEpisode(episode, show);
    } catch (error) {
      onError(error, this.snackBar, [this.seenLoading]);
    }
  }
}

const paramSchema = z.object({
  show: z.string(),
});

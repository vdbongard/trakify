import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  NgZone,
  OnDestroy,
  signal,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  catchError,
  combineLatest,
  filter,
  map,
  of,
  shareReplay,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { TmdbService } from '../../data/tmdb.service';
import { ShowService } from '../../data/show.service';
import { EpisodeService } from '../../data/episode.service';
import { onError } from '@helper/error';
import { ExecuteService } from '@services/execute.service';
import { SM } from '@constants';
import { LoadingState } from '@type/Enum';
import { z } from 'zod';
import { catchErrorAndReplay } from '@operator/catchErrorAndReplay';
import { ParamService } from '@services/param.service';
import { Episode, Show } from '@type/Trakt';
import { ListService } from '../../../lists/data/list.service';
import { AuthService } from '@services/auth.service';
import { DialogService } from '@services/dialog.service';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { ShowHeaderComponent } from './ui/show-header/show-header.component';
import { ShowCastComponent } from './ui/show-cast/show-cast.component';
import { ShowDetailsComponent } from './ui/show-details/show-details.component';
import { ShowNextEpisodeComponent } from './ui/show-next-episode/show-next-episode.component';
import { ShowSeasonsComponent } from './ui/show-seasons/show-seasons.component';
import { ShowLinksComponent } from './ui/show-links/show-links.component';
import { Cast, TmdbShow } from '@type/Tmdb';
import { distinctUntilChangedDeep } from '@operator/distinctUntilChangedDeep';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { isShowEnded } from '@helper/isShowEnded';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import { wait } from '@helper/wait';
import { ShowInfo } from '@type/Show';

@Component({
  selector: 't-show',
  standalone: true,
  imports: [
    LoadingComponent,
    ShowHeaderComponent,
    ShowCastComponent,
    ShowDetailsComponent,
    ShowNextEpisodeComponent,
    ShowSeasonsComponent,
    ShowLinksComponent,
  ],
  templateUrl: './show.component.html',
  styleUrl: './show.component.scss',
})
export default class ShowComponent implements OnDestroy {
  route = inject(ActivatedRoute);
  showService = inject(ShowService);
  tmdbService = inject(TmdbService);
  episodeService = inject(EpisodeService);
  snackBar = inject(MatSnackBar);
  executeService = inject(ExecuteService);
  observer = inject(BreakpointObserver);
  title = inject(Title);
  paramService = inject(ParamService);
  listService = inject(ListService);
  authService = inject(AuthService);
  dialogService = inject(DialogService);
  router = inject(Router);
  ngZone = inject(NgZone);
  destroyRef = inject(DestroyRef);

  pageState = signal(LoadingState.LOADING);
  isError = computed(() => this.pageState() === LoadingState.ERROR);
  seenLoading = signal(LoadingState.SUCCESS);
  back = history.state.back;
  cast?: Cast[];
  lightbox?: PhotoSwipeLightbox;
  info = this.router.getCurrentNavigation()?.extras.info as ShowInfo | undefined;

  isSmall = toSignal(
    this.observer.observe([`(max-width: ${SM})`]).pipe(map((breakpoint) => breakpoint.matches)),
  );

  params$ = this.paramService.params$(this.route.params, paramSchema, [this.pageState]);

  show$ = this.showService.show$(this.params$, [this.pageState]).pipe(
    tap((show) => {
      this.title.setTitle(`${show.title} - Trakify`);
      this.pageState.set(LoadingState.SUCCESS);
    }),
    shareReplay(),
  );
  show = toSignal(this.show$);

  isWatchlist = toSignal(
    combineLatest([this.show$, toObservable(this.listService.watchlist.s)]).pipe(
      map(
        ([show, watchlistItems]) =>
          !!watchlistItems?.find(
            (watchlistItem) => watchlistItem.show.ids.trakt === show.ids.trakt,
          ),
      ),
      catchErrorAndReplay('isWatchlist', this.snackBar, [this.pageState]),
    ),
  );

  showWatched$ = this.show$.pipe(
    switchMap((show) => this.showService.getShowWatched$(show)),
    catchErrorAndReplay('showWatched', this.snackBar, [this.pageState]),
  );
  showWatched = toSignal(this.showWatched$);

  showProgress$ = this.show$.pipe(
    switchMap((show) => this.showService.getShowProgress$(show)),
    map((showProgress) => {
      if (!showProgress) return;
      return {
        ...showProgress,
        seasons: [...showProgress.seasons].reverse(),
      };
    }),
    catchErrorAndReplay('showProgress', this.snackBar, [this.pageState]),
  );
  showProgress = toSignal(this.showProgress$);

  tmdbShow$ = this.show$.pipe(
    switchMap((show) =>
      this.tmdbService
        .getTmdbShow$(show, true, { fetchAlways: true })
        .pipe(startWith(this.info?.tmdbShow), distinctUntilChangedDeep()),
    ),
    map((show) => {
      if (!show) return;

      if (this.showProgress()) {
        show = { ...show, seasons: [...show.seasons].reverse() };
      }

      const showWithSpecialsSeasonAtEnd: TmdbShow = { ...show, seasons: [...show.seasons] };
      const season0Index = showWithSpecialsSeasonAtEnd.seasons.findIndex(
        (season) => season.season_number === 0,
      );
      if (season0Index >= 0) {
        // push specials season to end of array
        showWithSpecialsSeasonAtEnd.seasons.push(
          showWithSpecialsSeasonAtEnd.seasons.splice(season0Index, 1)[0],
        );
      }
      return showWithSpecialsSeasonAtEnd;
    }),
    tap((tmdbShow) => (this.cast = tmdbShow?.aggregate_credits?.cast)),
    catchErrorAndReplay(
      'tmdbShow',
      this.snackBar,
      [this.pageState],
      'An error occurred while fetching the tmdb show',
    ),
  );
  tmdbShow = toSignal(this.tmdbShow$);

  isFavorite = toSignal(
    combineLatest([this.show$, toObservable(this.showService.favorites.s)]).pipe(
      map(([show, favorites]) => !!favorites?.includes(show.ids.trakt)),
      catchErrorAndReplay('isFavorite', this.snackBar, [this.pageState]),
    ),
  );

  nextEpisode$ = combineLatest([
    this.tmdbShow$,
    this.showProgress$,
    this.showWatched$,
    this.show$,
  ]).pipe(
    map(([tmdbShow, showProgress, showWatched, show]) => {
      const isEnded = tmdbShow && isShowEnded(tmdbShow);

      let seasonNumber: number | null | undefined =
        showProgress && showProgress?.next_episode !== null
          ? showProgress?.next_episode?.season
          : (isEnded || showProgress?.next_episode === null) && showWatched
            ? null
            : 1;
      let episodeNumber: number | null | undefined =
        showProgress && showProgress?.next_episode !== null
          ? showProgress?.next_episode?.number
          : (isEnded || showProgress?.next_episode === null) && showWatched
            ? null
            : 1;

      if (seasonNumber === 0) {
        seasonNumber = null;
        episodeNumber = null;
      }

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
                ?.episodes?.find((episode) => episode.number === episodeNumber),
            ).pipe(catchError(() => of(undefined)))
          : of(seasonNumber as undefined | null),
      ]);
    }),
    catchErrorAndReplay('nextEpisode', this.snackBar, [this.pageState]),
  );
  nextEpisode = toSignal(this.nextEpisode$);
  nextTraktEpisode = computed(() => this.nextEpisode()?.[0] ?? null);

  tmdbSeason$ = combineLatest([this.show$, this.nextEpisode$]).pipe(
    switchMap(([show, nextEpisode]) => {
      const traktNextEpisode = nextEpisode[0];
      if (!traktNextEpisode) return of(undefined);
      return this.tmdbService.getTmdbSeason$(show, traktNextEpisode.season, true, true);
    }),
    catchErrorAndReplay('tmdbSeason', this.snackBar, [this.pageState]),
  );
  tmdbSeason = toSignal(this.tmdbSeason$);

  seasonEpisodes = toSignal(
    combineLatest([this.tmdbShow$, this.show$]).pipe(
      filter(([tmdbShow]) => !(tmdbShow && isShowEnded(tmdbShow))),
      switchMap(([tmdbShow, show]) => this.episodeService.fetchEpisodesFromShow(tmdbShow, show)),
      catchErrorAndReplay('seasonEpisodes', this.snackBar, [this.pageState]),
    ),
  );

  constructor() {
    // init lightbox after page is loaded
    effect(async () => {
      if (this.pageState() !== LoadingState.SUCCESS) return;

      // wait for image load
      await wait(500);

      this.ngZone.runOutsideAngular(() => {
        this.lightbox?.destroy();
        this.lightbox = new PhotoSwipeLightbox({
          gallery: '.image-link',
          pswpModule: (): Promise<unknown> => import('photoswipe'),
        });
        this.lightbox.init();
      });
    });
  }

  ngOnDestroy(): void {
    this.lightbox?.destroy();
    this.showService.activeShow.set(undefined);
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

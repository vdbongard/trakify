import { Component, computed, effect, inject, input, OnDestroy, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, first, lastValueFrom, map, of, tap } from 'rxjs';
import { injectQuery, keepPreviousData } from '@tanstack/angular-query-experimental';
import { queryKeys } from '@shared/query-keys';
import { ConfigService } from '@services/config.service';
import { TmdbService } from '../../data/tmdb.service';
import { ShowService } from '../../data/show.service';
import { EpisodeService } from '../../data/episode.service';
import { onError } from '@helper/error';
import { isDetailedProgress } from '@helper/episodes';
import { ExecuteService } from '@services/execute.service';
import { SM } from '@constants';
import { LoadingState } from '@type/Loading';
import { Episode, EpisodeFull, Show, ShowProgress } from '@type/Trakt';
import { ListService } from '../../../lists/data/list.service';
import { AuthService } from '@services/auth.service';
import { DialogService } from '@services/dialog.service';
import { SpinnerComponent } from '@shared/components/spinner/spinner.component';
import { ErrorText } from '@shared/components/error-text/error-text.component';
import { ShowHeaderComponent } from './ui/show-header/show-header.component';
import { ShowCastComponent } from './ui/show-cast/show-cast.component';
import { ShowDetailsComponent } from './ui/show-details/show-details.component';
import { ShowNextEpisodeComponent } from './ui/show-next-episode/show-next-episode.component';
import { ShowSeasonsComponent } from './ui/show-seasons/show-seasons.component';
import { ShowLinksComponent } from './ui/show-links/show-links.component';
import { TmdbEpisode, TmdbSeason, TmdbShow } from '@type/Tmdb';
import { toSignal } from '@angular/core/rxjs-interop';
import { isShowEnded } from '@helper/isShowEnded';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import { wait } from '@helper/wait';
import { ShowInfo } from '@type/Show';
import { NextEpisode } from '@type/Episode';

@Component({
  selector: 't-show',
  imports: [
    SpinnerComponent,
    ErrorText,
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
  showService = inject(ShowService);
  tmdbService = inject(TmdbService);
  episodeService = inject(EpisodeService);
  snackBar = inject(MatSnackBar);
  executeService = inject(ExecuteService);
  observer = inject(BreakpointObserver);
  title = inject(Title);
  listService = inject(ListService);
  authService = inject(AuthService);
  dialogService = inject(DialogService);
  router = inject(Router);
  configService = inject(ConfigService);

  show = input<string>('');

  seenLoading = signal<LoadingState>('success');
  back = history.state?.back;
  lightbox?: PhotoSwipeLightbox;
  info =
    (this.router.currentNavigation()?.extras.info as ShowInfo | undefined) ??
    (history.state?.showInfo as ShowInfo | undefined);

  isSmall = toSignal(
    this.observer.observe([`(max-width: ${SM})`]).pipe(map((breakpoint) => breakpoint.matches)),
  );

  showQuery = injectQuery(() => ({
    queryKey: queryKeys.show(this.show()),
    queryFn: (): Promise<Show> => lastValueFrom(this.showService.fetchShow(this.show())),
    initialData: (): Show | undefined => this.info?.show,
  }));

  isError = computed(() => this.showQuery.isError());

  showData = computed(() => this.showQuery.data());

  isWatchlist = computed(() => {
    const show = this.showData();
    if (!show) return false;
    return !!this.listService.watchlist
      .s()
      ?.find((watchlistItem) => watchlistItem.show.ids.trakt === show.ids.trakt);
  });

  showWatched = computed(() => {
    const show = this.showData();
    if (!show) return undefined;
    return (
      this.showService.showsWatched
        .s()
        ?.find((showWatched) => showWatched.show.ids.trakt === show.ids.trakt) ??
      this.info?.showWatched
    );
  });

  showProgress = computed(() => {
    const show = this.showData();
    if (!show) return undefined;
    const infoProgress = this.info?.showProgress;
    const showProgress =
      this.showService.showsProgress.s()?.[show.ids.trakt] ??
      (isDetailedProgress(infoProgress) ? infoProgress : undefined);
    if (!showProgress) return undefined;
    return { ...showProgress, seasons: [...showProgress.seasons].reverse() };
  });

  /**
   * Whether the user hasn't started watching the show yet. The on-page progress fetch
   * (ADR 0003) stores a progress record even for shows with no watch history — Trakt always
   * returns a progress object for `/shows/:id/progress/watched` (`completed: 0`) — so "new"
   * means "no watched episodes", not "no progress record". A watchlist-only show must keep
   * its "Mark show as seen" and watchlist buttons once that fetch resolves.
   */
  isNewShow = computed(() => {
    const showProgress = this.showProgress();
    return !showProgress || showProgress.completed === 0;
  });

  /**
   * Populates the seasonal per-show detail store when the page is opened (ADR 0003):
   * the bulk sync only fills the overview store, so the seasonal store is fetched here
   * on demand. `sync: true` writes the result into the store, and the tap re-publishes
   * the signal so the progress-based computeds pick it up.
   */
  showProgressQuery = injectQuery(() => ({
    queryKey: queryKeys.showProgress(this.showData()?.ids.trakt),
    queryFn: (): Promise<ShowProgress | undefined> => {
      const show = this.showData()!;
      return lastValueFrom(
        this.showService.getShowProgress$(show, { fetch: true, sync: true }).pipe(
          first(),
          tap(() => this.showService.updateShowsProgress()),
        ),
      );
    },
    enabled: !!this.showData(),
    initialData: (): ShowProgress | undefined => {
      const show = this.showData();
      return show ? this.showService.showsProgress.s()[show.ids.trakt] : undefined;
    },
  }));

  language = computed(() => this.configService.config.s().language);

  tmdbShowQuery = injectQuery(() => ({
    queryKey: queryKeys.tmdbShow(this.showData()?.ids.tmdb, this.language()),
    queryFn: (): Promise<TmdbShow> =>
      lastValueFrom(this.tmdbService.fetchTmdbShowExtended(this.showData()!)),
    enabled: !!this.showData(),
    initialData: (): TmdbShow | undefined | null => this.info?.tmdbShow,
  }));

  tmdbShow = computed(() => {
    let tmdbShow = this.tmdbShowQuery.data();
    if (!tmdbShow) return;

    if (this.showProgress()) {
      tmdbShow = { ...tmdbShow, seasons: [...tmdbShow.seasons].reverse() };
    }

    const showWithSpecialsSeasonAtEnd: TmdbShow = { ...tmdbShow, seasons: [...tmdbShow.seasons] };
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
  });
  cast = computed(() => this.tmdbShow()?.aggregate_credits?.cast);

  isFavorite = computed(() => {
    const show = this.showData();
    return show ? this.showService.isFavorite(show) : false;
  });

  private nextSeasonNumber = computed(() => {
    const showProgress = this.showProgress();

    if (showProgress && showProgress.next_episode != null) {
      if (showProgress.next_episode.season === 0) return null;
      return showProgress.next_episode.season;
    }

    const tmdbShow = this.tmdbShow();
    const isEnded = tmdbShow && isShowEnded(tmdbShow);
    const showWatched = this.showWatched();
    if ((isEnded || showProgress?.next_episode === null) && showWatched) {
      return null;
    }

    return 1;
  });

  private nextEpisodeNumber = computed(() => {
    const showProgress = this.showProgress();

    if (showProgress && showProgress.next_episode != null) {
      if (showProgress.next_episode.season === 0) return null;
      return showProgress.next_episode.number;
    }

    const tmdbShow = this.tmdbShow();
    const isEnded = tmdbShow && isShowEnded(tmdbShow);
    const showWatched = this.showWatched();
    if ((isEnded || showProgress?.next_episode === null) && showWatched) {
      return null;
    }

    return 1;
  });

  private nextEpisodeNumbers = computed(() => {
    // The optimistic "mark as seen" advance keeps a synthetic `next_episode` (the real next
    // season/number, trakt id 0) instead of an undefined transient; should it ever be
    // undefined, do not guess season/episode 1 here, or the lazy queries below would fetch
    // S01E01 (an unnecessary, possibly wrong request while the next episode is unknown).
    if (this.showProgress()?.next_episode === undefined) return undefined;

    const season = this.nextSeasonNumber();
    const episode = this.nextEpisodeNumber();
    if (season === null || episode === null) return undefined;
    return { season, episode };
  });

  /**
   * The next episode's detail is only fetched lazily now (ADR 0003): the sync no longer
   * pre-fetches it, so the show page fetches the trakt episode and its TMDB season
   * on demand once the seasonal progress has resolved its next-episode numbers.
   */
  nextEpisodeQuery = injectQuery(() => ({
    queryKey: queryKeys.episode(
      this.showData()?.ids.trakt,
      this.nextEpisodeNumbers()?.season,
      this.nextEpisodeNumbers()?.episode,
    ),
    queryFn: (): Promise<EpisodeFull | undefined | null> => {
      const show = this.showData()!;
      const { season, episode } = this.nextEpisodeNumbers()!;
      return lastValueFrom(
        this.episodeService.getEpisode$(show, season, episode, { fetch: true, sync: true }),
      );
    },
    // Stale-while-revalidate through the mark-as-seen advance: when the next episode numbers
    // change, keep serving the previous episode until the new one resolves so the episode
    // block stays mounted (no element removal / layout shift on "Mark as seen").
    placeholderData: keepPreviousData,
    enabled: !!this.showData() && !!this.showProgress() && !!this.nextEpisodeNumbers(),
  }));

  tmdbEpisodeQuery = injectQuery(() => ({
    queryKey: queryKeys.tmdbEpisode(
      this.showData()?.ids.tmdb,
      this.nextEpisodeNumbers()?.season,
      this.nextEpisodeNumbers()?.episode,
    ),
    queryFn: (): Promise<TmdbEpisode | undefined | null> => {
      const show = this.showData()!;
      const { season, episode } = this.nextEpisodeNumbers()!;
      return lastValueFrom(
        this.tmdbService.getTmdbEpisode$(show, season, episode, { fetch: true, sync: true }),
      );
    },
    // Keep the previous episode's TMDB data while the next episode loads (see nextEpisodeQuery).
    placeholderData: keepPreviousData,
    enabled:
      !!this.showData()?.ids.tmdb &&
      !!this.showData() &&
      !!this.showProgress() &&
      !!this.nextEpisodeNumbers(),
  }));

  tmdbSeasonQuery = injectQuery(() => ({
    queryKey: queryKeys.tmdbSeason(this.showData()?.ids.tmdb, this.nextEpisodeNumbers()?.season),
    queryFn: (): Promise<TmdbSeason | null> => {
      const show = this.showData()!;
      const { season } = this.nextEpisodeNumbers()!;
      return lastValueFrom(
        this.tmdbService.getTmdbSeason$(show, season, true, true).pipe(
          first(),
          catchError(() => of(null)),
        ),
      );
    },
    // Keep the previous season's TMDB data while the next episode loads (see nextEpisodeQuery).
    placeholderData: keepPreviousData,
    enabled:
      !!this.showData()?.ids.tmdb &&
      !!this.showData() &&
      !!this.showProgress() &&
      !!this.nextEpisodeNumbers(),
  }));

  nextEpisode = computed<NextEpisode | undefined>(() => {
    const show = this.showData();
    if (!show) return;

    const seasonNumber = this.nextSeasonNumber();
    const episodeNumber = this.nextEpisodeNumber();

    if (
      seasonNumber === undefined ||
      seasonNumber === null ||
      episodeNumber === undefined ||
      episodeNumber === null
    ) {
      return [null, null, null];
    }

    const episode = this.nextEpisodeQuery.data() ?? null;
    const tmdbEpisodeData = this.tmdbEpisodeQuery.data() ?? null;
    const showProgress = this.showProgress();
    const episodeProgress =
      showProgress?.seasons
        .find((season) => season.number === seasonNumber)
        ?.episodes.find((episode) => episode.number === episodeNumber) ?? null;

    return [episode, tmdbEpisodeData, episodeProgress];
  });

  nextTraktEpisode = computed(() => this.nextEpisode()?.[0] ?? null);

  nextEpisodeLoading = computed(() => {
    if (this.isError()) return false;
    const show = this.showData();
    if (!show) return false;

    if (!this.showProgress()) {
      return this.showProgressQuery.isPending() || this.showProgressQuery.isLoading();
    }

    if (this.nextSeasonNumber() !== null && this.nextEpisodeNumber() !== null) {
      return this.nextEpisode()?.[0] == null;
    }

    return false;
  });

  tmdbSeason = computed<TmdbSeason | undefined>(
    () => this.tmdbSeasonQuery.data() ?? this.info?.tmdbSeason ?? undefined,
  );

  episodesQuery = injectQuery(() => ({
    queryKey: queryKeys.episodes(this.showData()?.ids.trakt),
    queryFn: (): Promise<Record<string, EpisodeFull[] | undefined>> => {
      const tmdbShowData = this.tmdbShow();
      const show = this.showData()!;
      return lastValueFrom(this.episodeService.fetchEpisodesFromShow(tmdbShowData, show));
    },
    enabled: !!this.tmdbShow() && !!this.showData() && !isShowEnded(this.tmdbShow()!),
  }));

  episodes = computed(() => this.episodesQuery.data());

  readonly setTitleAndActiveShow = effect(() => {
    const show = this.showData();
    if (show) {
      this.title.setTitle(`${show.title} - Trakify`);
      this.showService.activeShow.set({ ...show });
    }
  });

  readonly updateLightbox = effect(async () => {
    if (!this.showQuery.isSuccess()) return;

    // wait for image load
    await wait(500);

    this.lightbox?.destroy();
    this.lightbox = new PhotoSwipeLightbox({
      gallery: '.image-link',
      pswpModule: (): Promise<unknown> => import('photoswipe'),
    });
    this.lightbox.init();
  });

  ngOnDestroy(): void {
    this.lightbox?.destroy();
    this.showService.activeShow.set(undefined);
  }

  async addToHistory(episode: Episode | undefined, show: Show): Promise<void> {
    if (!episode) throw Error('Episode is empty (addToHistory)');
    try {
      await this.executeService.addEpisode(episode, show, this.seenLoading);
    } catch (error) {
      onError(error, this.snackBar, [this.seenLoading]);
    }
  }
}

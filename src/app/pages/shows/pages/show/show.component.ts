import {
  afterNextRender,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  signal,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { BreakpointObserver } from '@angular/cdk/layout';
import { MatSnackBar } from '@angular/material/snack-bar';
import { map } from 'rxjs';
import { injectQuery, keepPreviousData } from '@tanstack/angular-query';
import { queryKeys } from '@shared/query-keys';
import { ConfigService } from '@services/config.service';
import { TmdbService } from '../../data/tmdb.service';
import { ShowService } from '../../data/show.service';
import { TranslationService } from '../../data/translation.service';
import { EpisodeService } from '../../data/episode.service';
import { ShowProgressService } from '../../data/show-progress.service';
import { onError } from '@helper/error';
import { noticeRefreshErrors } from '@helper/queryErrorNotice';
import { isDetailedProgress } from '@helper/episodes';
import { ExecuteService } from '@services/execute.service';
import { SM } from '@constants';
import { LoadingState } from '@type/Loading';
import { Episode, EpisodeFull, Show, ShowPeople, ShowProgress } from '@type/Trakt';
import { ListService } from '../../../lists/data/list.service';
import { AuthService } from '@services/auth.service';
import { DialogService } from '@services/dialog.service';
import { QueryErrorNoticeService } from '@services/query-error-notice.service';
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
import { getShowPosterPath } from '@helper/getShowPosterPath';
import { type ArtworkLightbox, createArtworkLightbox } from '@helper/artworkLightbox';
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
  providers: [QueryErrorNoticeService],
})
export default class ShowComponent implements OnDestroy {
  showService = inject(ShowService);
  tmdbService = inject(TmdbService);
  episodeService = inject(EpisodeService);
  showProgressService = inject(ShowProgressService);
  snackBar = inject(MatSnackBar);
  executeService = inject(ExecuteService);
  queryErrorNotice = inject(QueryErrorNoticeService);
  observer = inject(BreakpointObserver);
  title = inject(Title);
  listService = inject(ListService);
  authService = inject(AuthService);
  dialogService = inject(DialogService);
  router = inject(Router);
  configService = inject(ConfigService);
  translationService = inject(TranslationService);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  show = input<string>('');

  seenLoading = signal<LoadingState>('success');
  seenFeedbackEpisodeId = signal<number | undefined>(undefined);
  private pendingSeenEpisodeId = signal<number | undefined>(undefined);
  private seenFeedbackTimer?: ReturnType<typeof setTimeout>;
  back = history.state?.back;
  lightbox?: ArtworkLightbox;
  info =
    (this.router.currentNavigation()?.extras.info as ShowInfo | undefined) ??
    (history.state?.showInfo as ShowInfo | undefined);

  previousUrl = this.router.currentNavigation()?.previousNavigation?.finalUrl?.toString();

  constructor() {
    afterNextRender(() => {
      this.lightbox = createArtworkLightbox(this.host.nativeElement, 'poster');
    });
  }

  isSmall = toSignal(
    this.observer.observe([`(max-width: ${SM})`]).pipe(map((breakpoint) => breakpoint.matches)),
  );

  showQuery = injectQuery(() => ({
    queryKey: queryKeys.show(this.show()),
    queryFn: (): Promise<Show> => this.showService.fetchShow(this.show()),
    initialData: (): Show | undefined => this.info?.show,
  }));

  isError = computed(() => this.showQuery.isError());

  showData = computed(() => {
    const show = this.showQuery.data();
    return show ? this.translationService.translateShow(show) : undefined;
  });

  showPeopleQuery = injectQuery(() => ({
    queryKey: queryKeys.showPeople(this.showData()?.ids.trakt),
    queryFn: (): Promise<ShowPeople> =>
      this.showService.fetchShowPeople(this.showData()!.ids.trakt),
    enabled: !!this.showData(),
  }));

  traktPersonSlugs = computed(() =>
    Object.fromEntries(
      (this.showPeopleQuery.data()?.cast ?? []).flatMap(({ person }) =>
        person.ids.tmdb != null ? [[person.ids.tmdb, person.ids.slug]] : [],
      ),
    ),
  );

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
    return { ...showProgress, seasons: [...(showProgress.seasons ?? [])].reverse() };
  });

  progressView = computed(() => {
    const show = this.showData();
    return show ? this.showProgressService.progress(show)() : undefined;
  });

  isNewShow = computed<boolean | undefined>(() => {
    const show = this.showData();
    if (!show) return undefined;

    const showProgress = this.showProgress();
    if (showProgress) return showProgress.completed === 0;

    const isLoading = this.showProgressQuery.isPending() || this.showProgressQuery.isLoading();
    return isLoading ? undefined : true;
  });

  showProgressQuery = injectQuery(() => ({
    queryKey: queryKeys.showProgress(this.showData()?.ids.trakt),
    queryFn: (): Promise<ShowProgress | undefined> => {
      const show = this.showData()!;
      return this.showService.syncShowProgress(show.ids.trakt);
    },
    enabled: !!this.showData(),
    initialData: (): ShowProgress | undefined => {
      const show = this.showData();
      return show ? this.showService.showsProgress.s()[show.ids.trakt] : undefined;
    },
  }));

  language = computed(() => this.configService.config.s().language);

  tmdbShowQuery = injectQuery(() => ({
    queryKey: queryKeys.tmdbShow(this.showData()?.ids.tmdb ?? null, this.language()),
    queryFn: (): Promise<TmdbShow> => this.tmdbService.fetchTmdbShowExtended(this.showData()!),
    enabled: !!this.showData(),
    initialData: (): TmdbShow | null => this.info?.tmdbShow ?? null,
  }));

  private readonly refreshErrorNotice = effect(() => {
    if (!this.showData()) return;
    noticeRefreshErrors(
      this.queryErrorNotice,
      [this.showQuery.error(), this.tmdbShowQuery.error()],
      () => {
        void this.showQuery.refetch();
        void this.tmdbShowQuery.refetch();
      },
    );
  });

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
      showWithSpecialsSeasonAtEnd.seasons.push(
        showWithSpecialsSeasonAtEnd.seasons.splice(season0Index, 1)[0],
      );
    }
    return showWithSpecialsSeasonAtEnd;
  });
  cast = computed(() => this.tmdbShow()?.aggregate_credits?.cast);

  posterPath = computed<string | undefined>(() => {
    if (!this.showWatched()) return this.tmdbShow()?.poster_path ?? undefined;
    return getShowPosterPath(
      this.tmdbShow(),
      this.showProgress()?.next_episode?.season,
      this.info?.tmdbSeason,
    );
  });

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

    if (showProgress?.next_episode === null) return null;

    const tmdbShow = this.tmdbShow();
    const isEnded = tmdbShow && isShowEnded(tmdbShow);
    const showWatched = this.showWatched();
    if (isEnded && showWatched) {
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

    if (showProgress?.next_episode === null) return null;

    const tmdbShow = this.tmdbShow();
    const isEnded = tmdbShow && isShowEnded(tmdbShow);
    const showWatched = this.showWatched();
    if (isEnded && showWatched) {
      return null;
    }

    return 1;
  });

  private nextEpisodeNumbers = computed(() => {
    if (this.showProgress()?.next_episode === undefined) return undefined;

    const season = this.nextSeasonNumber();
    const episode = this.nextEpisodeNumber();
    if (season === null || episode === null) return undefined;
    return { season, episode };
  });

  nextEpisodeQuery = injectQuery(() => ({
    queryKey: queryKeys.episode(
      this.showData()?.ids.trakt,
      this.nextEpisodeNumbers()?.season,
      this.nextEpisodeNumbers()?.episode,
    ),
    queryFn: (): Promise<EpisodeFull | null> => {
      const show = this.showData()!;
      const { season, episode } = this.nextEpisodeNumbers()!;
      return this.episodeService.fetchEpisode(show, season, episode, { persist: true });
    },
    placeholderData: keepPreviousData,
    enabled: !!this.showData() && !!this.showProgress() && !!this.nextEpisodeNumbers(),
  }));

  tmdbEpisodeQuery = injectQuery(() => ({
    queryKey: queryKeys.tmdbEpisode(
      this.showData()?.ids.tmdb,
      this.nextEpisodeNumbers()?.season,
      this.nextEpisodeNumbers()?.episode,
    ),
    queryFn: (): Promise<TmdbEpisode | null> => {
      const show = this.showData()!;
      const { season, episode } = this.nextEpisodeNumbers()!;
      return this.tmdbService.fetchTmdbEpisode(show, season, episode, { persist: true });
    },
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
      return this.tmdbService.fetchTmdbSeason(show, season).catch(() => null);
    },
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

    if (seasonNumber == null || episodeNumber == null) {
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
      const tmdbShowData = this.tmdbShow() ?? null;
      const show = this.showData()!;
      return this.episodeService.fetchEpisodesFromShow(tmdbShowData, show);
    },
    enabled: !!this.tmdbShow() && !!this.showData() && !isShowEnded(this.tmdbShow()!),
  }));

  episodes = computed(() => this.episodesQuery.data());

  readonly cacheSeasonEpisodes = effect(() => {
    const show = this.showData();
    const episodes = this.episodes();
    if (!show || !episodes) return;
    for (const [seasonNumber, seasonEpisodes] of Object.entries(episodes)) {
      if (seasonEpisodes) {
        this.showProgressService.setSeasonEpisodes(show, Number(seasonNumber), seasonEpisodes);
      }
    }
  });

  readonly setTitleAndActiveShow = effect(() => {
    const show = this.showData();
    if (show) {
      this.title.setTitle(`${show.title} - Trakify`);
      this.showService.activeShow.set({ ...show });
    }
  });

  readonly updateSeenFeedback = effect(() => {
    const loadingState = this.seenLoading();
    const episodeId = this.pendingSeenEpisodeId();
    if (episodeId === undefined || loadingState === 'loading') return;

    this.pendingSeenEpisodeId.set(undefined);
    if (loadingState === 'error') return;

    this.seenFeedbackEpisodeId.set(episodeId);
    clearTimeout(this.seenFeedbackTimer);
    this.seenFeedbackTimer = setTimeout(() => this.seenFeedbackEpisodeId.set(undefined), 2200);
  });

  ngOnDestroy(): void {
    this.lightbox?.destroy();
    this.showService.activeShow.set(undefined);
    clearTimeout(this.seenFeedbackTimer);
  }

  async addToHistory(episode: Episode, show: Show): Promise<void> {
    this.pendingSeenEpisodeId.set(episode.ids.trakt);
    this.seenFeedbackEpisodeId.set(undefined);
    clearTimeout(this.seenFeedbackTimer);
    try {
      await this.executeService.addEpisode(episode, show, this.seenLoading);
    } catch (error) {
      this.pendingSeenEpisodeId.set(undefined);
      onError(error, this.snackBar, [this.seenLoading]);
    }
  }
}

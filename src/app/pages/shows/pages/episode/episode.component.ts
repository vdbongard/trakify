import {
  afterNextRender,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  linkedSignal,
  OnDestroy,
  signal,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { injectQuery } from '@tanstack/angular-query';
import { queryKeys } from '@shared/query-keys';
import { TmdbService } from '../../data/tmdb.service';
import { ShowService } from '../../data/show.service';
import { EpisodeService } from '../../data/episode.service';
import { TranslationService } from '../../data/translation.service';
import { ExecuteService } from '@services/execute.service';
import { SeasonService } from '../../data/season.service';
import { LoadingState } from '@type/Loading';
import { BreadcrumbPart } from '@type/Breadcrumb';
import { AuthService } from '@services/auth.service';
import { QueryErrorNoticeService } from '@services/query-error-notice.service';
import { SpinnerComponent } from '@shared/components/spinner/spinner.component';
import { ErrorText } from '@shared/components/error-text/error-text.component';
import { noticeRefreshErrors } from '@helper/queryErrorNotice';
import { EpisodeHeaderComponent } from './ui/episode-header/episode-header.component';
import { BaseEpisodeComponent } from '@shared/components/episode/base-episode.component';
import { seasonTitle } from '@helper/seasonTitle';
import { episodeTitle } from '@helper/episodeTitle';
import { type ArtworkLightbox, createArtworkLightbox } from '@helper/artworkLightbox';
import { EpisodeFull, EpisodeProgress, SeasonProgress, Show, ShowProgress } from '@type/Trakt';
import { TmdbEpisode } from '@type/Tmdb';
import { EpisodeInfo } from '@type/Episode';
import { EPISODE_STILL_TRANSITION_NAME } from '@constants';
import { EpisodeStillComponent } from '@shared/components/episode-still/episode-still.component';

@Component({
  selector: 't-episode-page',
  imports: [
    SpinnerComponent,
    ErrorText,
    EpisodeHeaderComponent,
    BaseEpisodeComponent,
    EpisodeStillComponent,
  ],
  templateUrl: './episode.component.html',
  styleUrl: './episode.component.scss',
  providers: [QueryErrorNoticeService],
})
export default class EpisodeComponent implements OnDestroy {
  tmdbService = inject(TmdbService);
  showService = inject(ShowService);
  episodeService = inject(EpisodeService);
  translationService = inject(TranslationService);
  executeService = inject(ExecuteService);
  seasonService = inject(SeasonService);
  title = inject(Title);
  authService = inject(AuthService);
  queryErrorNotice = inject(QueryErrorNoticeService);
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  show = input<string>('');
  season = input<string>('');
  episode = input<string>('');

  constructor() {
    afterNextRender(() => {
      this.lightbox = createArtworkLightbox(this.host.nativeElement, 'still');
    });
  }

  private episodeKey = computed(() => `${this.show()}/${this.season()}/${this.episode()}`);

  episodeInfo = linkedSignal<string, EpisodeInfo | undefined>({
    source: this.episodeKey,
    computation: () => history.state?.episodeInfo as EpisodeInfo | undefined,
  });

  isStillTransitionTarget = computed(
    () => this.episodeInfo()?.tmdbEpisode?.still_path !== undefined,
  );

  stillTransitionName = computed(() =>
    this.isStillTransitionTarget() ? EPISODE_STILL_TRANSITION_NAME : undefined,
  );

  episodeStillTransitionName = computed(() =>
    this.tmdbEpisodeQuery.data()?.still_path ? EPISODE_STILL_TRANSITION_NAME : undefined,
  );

  seenState = signal<LoadingState>('success');
  breadcrumbParts = signal<BreadcrumbPart[]>([]);
  lightbox?: ArtworkLightbox;

  showQuery = injectQuery(() => ({
    queryKey: queryKeys.show(this.show()),
    queryFn: (): Promise<Show> => this.showService.fetchShow(this.show()),
    initialData: (): Show | undefined => this.episodeInfo()?.show,
  }));

  showData = computed(() => {
    const show = this.showQuery.data();
    return show ? this.translationService.translateShow(show) : undefined;
  });

  showProgressQuery = injectQuery(() => ({
    queryKey: queryKeys.showProgress(this.showQuery.data()?.ids.trakt),
    queryFn: (): Promise<ShowProgress | undefined> => {
      const show = this.showQuery.data()!;
      return this.showService.syncShowProgress(show.ids.trakt);
    },
    enabled: !!this.showQuery.data(),
    initialData: (): ShowProgress | undefined => {
      const show = this.showQuery.data();
      return show ? this.showService.showsProgress.s()[show.ids.trakt] : undefined;
    },
  }));

  seasonProgress = computed<SeasonProgress | undefined>(() => {
    const show = this.showQuery.data();
    if (!show) return undefined;
    const progress =
      this.showService.showsProgress.s()?.[show.ids.trakt] ?? this.showProgressQuery.data();
    return progress?.seasons?.find((season) => season.number === parseInt(this.season()));
  });

  episodeProgress = computed<EpisodeProgress | undefined>(() => {
    const show = this.showQuery.data();
    if (!show) return undefined;

    const progress =
      this.showService.showsProgress.s()?.[show.ids.trakt] ?? this.showProgressQuery.data();
    const episodeProgress = progress?.seasons?.find(
      (season) => season.number === parseInt(this.season()),
    )?.episodes[parseInt(this.episode()) - 1];
    return episodeProgress ? { ...episodeProgress } : undefined;
  });

  seasonEpisodesQuery = injectQuery(() => ({
    queryKey: queryKeys.seasonEpisodes(this.showQuery.data()?.ids.trakt, parseInt(this.season())),
    queryFn: (): Promise<EpisodeFull[]> =>
      this.seasonService.getSeasonEpisodes<EpisodeFull>(
        this.showQuery.data()!,
        parseInt(this.season()),
      ),
    enabled: !!this.showQuery.data(),
  }));

  seasonEpisode = computed(() =>
    this.seasonEpisodesQuery
      .data()
      ?.find(
        (episode) =>
          episode.season === parseInt(this.season()) && episode.number === parseInt(this.episode()),
      ),
  );

  episodeForHeader = computed(() => this.episodeQuery.data() ?? this.seasonEpisode());

  episodeQuery = injectQuery(() => ({
    queryKey: queryKeys.episode(
      this.showQuery.data()?.ids.trakt,
      parseInt(this.season()),
      parseInt(this.episode()),
    ),
    queryFn: (): Promise<EpisodeFull | null> =>
      this.episodeService.fetchEpisode(
        this.showQuery.data()!,
        parseInt(this.season()),
        parseInt(this.episode()),
        { force: true },
      ),
    enabled: !!this.showQuery.data(),
  }));

  tmdbEpisodeQuery = injectQuery(() => ({
    queryKey: queryKeys.tmdbEpisode(
      this.showQuery.data()?.ids.tmdb,
      parseInt(this.season()),
      parseInt(this.episode()),
    ),
    queryFn: (): Promise<TmdbEpisode | null> =>
      this.tmdbService.fetchTmdbEpisode(
        this.showQuery.data()!,
        parseInt(this.season()),
        parseInt(this.episode()),
        { force: true },
      ),
    enabled: !!this.showQuery.data(),
  }));

  private readonly refreshErrorNotice = effect(() => {
    const hasEpisode = this.episodeQuery.data() !== undefined;
    noticeRefreshErrors(
      this.queryErrorNotice,
      [
        this.showData() ? this.showQuery.error() : null,
        hasEpisode ? this.episodeQuery.error() : null,
        hasEpisode ? this.tmdbEpisodeQuery.error() : null,
      ],
      () => {
        void this.showQuery.refetch();
        void this.episodeQuery.refetch();
        void this.tmdbEpisodeQuery.refetch();
      },
    );
  });

  readonly setActiveShow = effect(() => {
    const showData = this.showData();
    if (showData) {
      this.showService.activeShow.set({ ...showData });
    }
  });

  readonly setTitle = effect(() => {
    const episode = this.episodeForHeader();
    const episodeProgress = this.episodeProgress();
    const tmdbEpisode = this.tmdbEpisodeQuery.data();
    const showData = this.showData();
    if (!showData) return;

    this.title.setTitle(
      `${episodeTitle(episode, episodeProgress?.number, tmdbEpisode)}
        - ${showData.title}
        - ${seasonTitle(this.season())}
        - Trakify`,
    );
  });

  readonly setBreadcrumb = effect(() => {
    const showData = this.showData();
    if (!showData) return;

    this.breadcrumbParts.set([
      {
        name: showData.title,
        link: `/shows/s/${this.show()}`,
      },
      {
        name: seasonTitle(this.season(), this.seasonProgress()?.title),
        link: `/shows/s/${this.show()}/season/${this.season()}`,
      },
      {
        name: `Episode ${this.episode()}`,
        link: `/shows/s/${this.show()}/season/${this.season()}/episode/${this.episode()}`,
      },
    ]);
  });

  ngOnDestroy(): void {
    this.lightbox?.destroy();
    this.showService.activeShow.set(undefined);
  }
}

import { Component, computed, effect, inject, input, OnDestroy, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { first, lastValueFrom, tap } from 'rxjs';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { queryKeys } from '@shared/query-keys';
import { TmdbService } from '../../data/tmdb.service';
import { ShowService } from '../../data/show.service';
import { EpisodeService } from '../../data/episode.service';
import { ExecuteService } from '@services/execute.service';
import { SeasonService } from '../../data/season.service';
import { LoadingState } from '@type/Loading';
import { BreadcrumbPart } from '@type/Breadcrumb';
import { AuthService } from '@services/auth.service';
import { SpinnerComponent } from '@shared/components/spinner/spinner.component';
import { ErrorText } from '@shared/components/error-text/error-text.component';
import { EpisodeHeaderComponent } from './ui/episode-header/episode-header.component';
import { BaseEpisodeComponent } from '@shared/components/episode/base-episode.component';
import { seasonTitle } from '@helper/seasonTitle';
import { episodeTitle } from '@helper/episodeTitle';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import { wait } from '@helper/wait';
import { EpisodeFull, EpisodeProgress, SeasonProgress, Show, ShowProgress } from '@type/Trakt';
import { TmdbEpisode } from '@type/Tmdb';

@Component({
  selector: 't-episode-page',
  imports: [SpinnerComponent, ErrorText, EpisodeHeaderComponent, BaseEpisodeComponent],
  templateUrl: './episode.component.html',
  styleUrl: './episode.component.scss',
})
export default class EpisodeComponent implements OnDestroy {
  tmdbService = inject(TmdbService);
  showService = inject(ShowService);
  episodeService = inject(EpisodeService);
  executeService = inject(ExecuteService);
  seasonService = inject(SeasonService);
  title = inject(Title);
  authService = inject(AuthService);

  show = input<string>('');
  season = input<string>('');
  episode = input<string>('');

  seenState = signal<LoadingState>('success');
  breadcrumbParts = signal<BreadcrumbPart[]>([]);
  lightbox?: PhotoSwipeLightbox;

  showQuery = injectQuery(() => ({
    queryKey: queryKeys.show(this.show()),
    queryFn: (): Promise<Show> => lastValueFrom(this.showService.fetchShow(this.show())),
  }));

  showProgressQuery = injectQuery(() => ({
    queryKey: queryKeys.showProgress(this.showQuery.data()?.ids.trakt),
    queryFn: (): Promise<ShowProgress | undefined> => {
      const show = this.showQuery.data()!;
      return lastValueFrom(
        this.showService.getShowProgress$(show, { fetch: true, sync: true }).pipe(
          first(),
          tap(() => this.showService.updateShowsProgress()),
        ),
      );
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

    // ExecuteService updates nested progress records optimistically, then publishes a shallow
    // copy of the root store. Copy this leaf too: otherwise Angular's computed equality sees the
    // same mutated episode object and the Mark as seen/unseen label never refreshes.
    const progress =
      this.showService.showsProgress.s()?.[show.ids.trakt] ?? this.showProgressQuery.data();
    const episodeProgress = progress?.seasons.find(
      (season) => season.number === parseInt(this.season()),
    )?.episodes[parseInt(this.episode()) - 1];
    return episodeProgress ? { ...episodeProgress } : undefined;
  });

  seasonEpisodesQuery = injectQuery(() => ({
    queryKey: queryKeys.seasonEpisodes(this.showQuery.data()?.ids.trakt, parseInt(this.season())),
    queryFn: (): Promise<EpisodeFull[]> =>
      lastValueFrom(
        this.seasonService.getSeasonEpisodes$(
          this.showQuery.data()!,
          parseInt(this.season()),
          false,
          false,
        ),
      ),
    enabled: !!this.showQuery.data(),
  }));

  episodeQuery = injectQuery(() => ({
    queryKey: queryKeys.episode(
      this.showQuery.data()?.ids.trakt,
      parseInt(this.season()),
      parseInt(this.episode()),
    ),
    queryFn: (): Promise<EpisodeFull | undefined | null> =>
      lastValueFrom(
        this.episodeService.getEpisode$(
          this.showQuery.data()!,
          parseInt(this.season()),
          parseInt(this.episode()),
          { fetchAlways: true },
        ),
      ),
    enabled: !!this.showQuery.data(),
  }));

  tmdbEpisodeQuery = injectQuery(() => ({
    queryKey: queryKeys.tmdbEpisode(
      this.showQuery.data()?.ids.tmdb,
      parseInt(this.season()),
      parseInt(this.episode()),
    ),
    queryFn: (): Promise<TmdbEpisode | undefined | null> =>
      lastValueFrom(
        this.tmdbService.getTmdbEpisode$(
          this.showQuery.data()!,
          parseInt(this.season()),
          parseInt(this.episode()),
          { fetchAlways: true },
        ),
      ),
    enabled: !!this.showQuery.data(),
  }));

  readonly setActiveShow = effect(() => {
    const showData = this.showQuery.data();
    if (showData) {
      this.showService.activeShow.set({ ...showData });
    }
  });

  readonly setTitle = effect(() => {
    const episode = this.episodeQuery.data();
    const episodeProgress = this.episodeProgress();
    const tmdbEpisode = this.tmdbEpisodeQuery.data();
    const showData = this.showQuery.data();
    if (!showData) return;

    this.title.setTitle(
      `${episodeTitle(episode, episodeProgress?.number, tmdbEpisode)}
        - ${showData.title}
        - ${seasonTitle(this.season())}
        - Trakify`,
    );
  });

  readonly setBreadcrumb = effect(() => {
    const showData = this.showQuery.data();
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

  readonly updateLightbox = effect(() => {
    if (!this.episodeQuery.data() || !this.tmdbEpisodeQuery.data()) return;
    this.lightbox?.destroy();
    this.initLightbox();
  });

  ngOnDestroy(): void {
    this.lightbox?.destroy();
    this.showService.activeShow.set(undefined);
  }

  async initLightbox(): Promise<void> {
    await wait(10); // wait for child components that contain the image to render
    this.lightbox = new PhotoSwipeLightbox({
      gallery: '.image-link',
      pswpModule: (): Promise<unknown> => import('photoswipe'),
    });
    this.lightbox.init();
  }
}

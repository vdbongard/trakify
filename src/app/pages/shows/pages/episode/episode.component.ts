import { Component, NgZone, type OnDestroy, computed, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { episodeTitle } from '@helper/episodeTitle';
import { seasonTitle } from '@helper/seasonTitle';
import { wait } from '@helper/wait';
import { catchErrorAndReplay } from '@operator/catchErrorAndReplay';
import { AuthService } from '@services/auth.service';
import { ExecuteService } from '@services/execute.service';
import { ParamService } from '@services/param.service';
import { BaseEpisodeComponent } from '@shared/components/episode/base-episode.component';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import * as Paths from '@shared/paths';
import type { BreadcrumbPart } from '@type/Breadcrumb';
import { LoadingState } from '@type/Enum';
import PhotoSwipeLightbox from 'photoswipe/lightbox';
import {
  catchError,
  combineLatest,
  concat,
  distinctUntilChanged,
  of,
  skip,
  switchMap,
  tap,
} from 'rxjs';
import { z } from 'zod';
import { EpisodeService } from '../../data/episode.service';
import { SeasonService } from '../../data/season.service';
import { ShowService } from '../../data/show.service';
import { TmdbService } from '../../data/tmdb.service';
import { ShowHeaderComponent } from '../show/ui/show-header/show-header.component';
import { EpisodeHeaderComponent } from './ui/episode-header/episode-header.component';

@Component({
  selector: 't-episode-page',
  standalone: true,
  imports: [LoadingComponent, EpisodeHeaderComponent, BaseEpisodeComponent, ShowHeaderComponent],
  templateUrl: './episode.component.html',
  styleUrl: './episode.component.scss',
})
export default class EpisodeComponent implements OnDestroy {
  route = inject(ActivatedRoute);
  tmdbService = inject(TmdbService);
  snackBar = inject(MatSnackBar);
  showService = inject(ShowService);
  episodeService = inject(EpisodeService);
  executeService = inject(ExecuteService);
  seasonService = inject(SeasonService);
  title = inject(Title);
  paramService = inject(ParamService);
  authService = inject(AuthService);
  router = inject(Router);
  ngZone = inject(NgZone);

  pageState = signal(LoadingState.LOADING);
  episodeState = signal(LoadingState.LOADING);
  seenState = signal(LoadingState.SUCCESS);
  state = LoadingState;
  breadcrumbParts: BreadcrumbPart[] = [];
  lightbox?: PhotoSwipeLightbox;

  // biome-ignore lint/correctness/noInvalidUseBeforeDeclaration: It is always available here
  params$ = this.paramService.params$(this.route.params, paramSchema, [this.pageState]);
  params = toSignal(this.params$);
  episodeNumber = computed(() => this.params()?.episode ?? '');
  seasonNumber = computed(() => this.params()?.season ?? '');
  showSlug = computed(() => this.params()?.show ?? '');

  show$ = this.showService.show$(this.params$, [this.pageState]);
  show = toSignal(this.show$);

  seasonEpisodes = toSignal(
    combineLatest([this.params$, this.show$]).pipe(
      distinctUntilChanged((a, b) => a[0].season === b[0].season),
      switchMap(([params, show]) =>
        concat(
          of(null),
          this.seasonService.getSeasonEpisodes$(show, Number.parseInt(params.season), false, false),
        ),
      ),
      skip(1),
      catchErrorAndReplay('seasonEpisodes', this.snackBar, [this.pageState]),
    ),
  );

  showProgress = toSignal(
    this.show$.pipe(
      switchMap((show) => concat(of(null), this.showService.getShowProgress$(show))),
      skip(1),
      catchErrorAndReplay('showProgress', this.snackBar, [this.pageState]),
    ),
  );

  episodeProgress$ = combineLatest([this.params$, this.show$]).pipe(
    switchMap(([params, show]) =>
      concat(
        of(null),
        this.episodeService.getEpisodeProgress$(
          show,
          Number.parseInt(params.season),
          Number.parseInt(params.episode),
        ),
      ),
    ),
    skip(1),
    catchErrorAndReplay('episodeProgress', this.snackBar, [this.pageState]),
  );
  episodeProgress = toSignal(this.episodeProgress$);

  episode$ = combineLatest([this.params$, this.show$]).pipe(
    switchMap(([params, show]) =>
      concat(
        of(null),
        this.episodeService
          .getEpisode$(show, Number.parseInt(params.season), Number.parseInt(params.episode), {
            fetchAlways: true,
          })
          .pipe(catchError(() => of(undefined))),
      ),
    ),
    skip(1),
    tap(() => this.episodeState.set(LoadingState.SUCCESS)),
    catchErrorAndReplay('episode', this.snackBar, [this.pageState, this.episodeState]),
  );
  episode = toSignal(this.episode$);

  tmdbEpisode$ = combineLatest([this.params$, this.show$]).pipe(
    switchMap(([params, show]) =>
      concat(
        of(null),
        this.tmdbService.getTmdbEpisode$(
          show,
          Number.parseInt(params.season),
          Number.parseInt(params.episode),
          {
            fetchAlways: true,
          },
        ),
      ),
    ),
    skip(1),
    tap(() => this.episodeState.set(LoadingState.SUCCESS)),
    catchErrorAndReplay('tmdbEpisode', this.snackBar, [this.pageState, this.episodeState]),
  );
  tmdbEpisode = toSignal(this.tmdbEpisode$);

  constructor() {
    combineLatest([
      this.episode$,
      this.episodeProgress$,
      this.show$,
      this.params$,
      this.tmdbEpisode$,
    ])
      .pipe(takeUntilDestroyed())
      .subscribe(([episode, episodeProgress, show, params, tmdbEpisode]) => {
        this.title.setTitle(
          `${episodeTitle(episode, episodeProgress?.number, tmdbEpisode)}
            - ${show.title}
            - ${seasonTitle(`Season ${params.season}`)}
            - Trakify`,
        );
      });

    combineLatest([this.params$, this.show$])
      .pipe(takeUntilDestroyed())
      .subscribe(([params, show]) => {
        this.pageState.set(LoadingState.SUCCESS);
        this.breadcrumbParts = [
          {
            name: show.title,
            link: Paths.show({ show: params.show }),
          },
          {
            name: seasonTitle(`Season ${params.season}`),
            link: Paths.season({ show: params.show, season: params.season }),
          },
          {
            name: `Episode ${params.episode}`,
            link: Paths.episode({
              show: params.show,
              season: params.season,
              episode: params.episode,
            }),
          },
        ];
      });

    // init lightbox and re-init if episode still changes
    effect(() => {
      if (this.tmdbEpisode()) {
        this.lightbox?.destroy();
        this.initLightbox();
      }
    });
  }

  ngOnDestroy(): void {
    this.lightbox?.destroy();
    this.showService.activeShow.set(undefined);
  }

  initLightbox(): void {
    this.ngZone.runOutsideAngular(async () => {
      await wait(10); // wait for child components that contain the image to render
      this.lightbox = new PhotoSwipeLightbox({
        gallery: '.image-link',
        pswpModule: () => import('photoswipe'),
      });
      this.lightbox.init();
    });
  }
}

const paramSchema = z.object({
  show: z.string(),
  season: z.string(),
  episode: z.string(),
});

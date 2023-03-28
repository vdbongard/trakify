import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  concat,
  distinctUntilChanged,
  of,
  skip,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';

import { TmdbService } from '../../data/tmdb.service';
import { Base } from '@helper/base';
import { ShowService } from '../../data/show.service';
import { EpisodeService } from '../../data/episode.service';
import { ExecuteService } from '@services/execute.service';
import { SeasonService } from '../../data/season.service';

import { LoadingState } from '@type/Enum';
import { BreadcrumbPart } from '@type/Breadcrumb';
import { episodeTitle } from '../../utils/pipes/episode-title.pipe';
import { seasonTitle } from '../../utils/pipes/season-title.pipe';
import * as Paths from '@shared/paths';
import { z } from 'zod';
import { catchErrorAndReplay } from '@operator/catchErrorAndReplay';
import { ParamService } from '@services/param.service';
import { AuthService } from '@services/auth.service';
import { DialogService } from '@services/dialog.service';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { EpisodeHeaderComponent } from '../../ui/episode-header/episode-header.component';
import { AsyncPipe, NgIf } from '@angular/common';
import { BaseEpisodeComponent } from '@shared/components/episode/base-episode.component';
import { ShowHeaderComponent } from '../../ui/show-header/show-header.component';

@Component({
  selector: 't-episode-page',
  templateUrl: './episode.component.html',
  styleUrls: ['./episode.component.scss'],
  standalone: true,
  imports: [
    LoadingComponent,
    EpisodeHeaderComponent,
    NgIf,
    AsyncPipe,
    BaseEpisodeComponent,
    ShowHeaderComponent,
  ],
})
export class EpisodeComponent extends Base implements OnInit, OnDestroy {
  pageState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  episodeState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  seenState = new BehaviorSubject<LoadingState>(LoadingState.SUCCESS);
  state = LoadingState;
  breadcrumbParts?: BreadcrumbPart[];

  params$ = this.paramService.params$(this.route.params, paramSchema, [this.pageState]);

  show$ = this.showService.show$(this.params$, [this.pageState]);

  seasonEpisodes$ = combineLatest([this.params$, this.show$]).pipe(
    distinctUntilChanged((a, b) => a[0].season === b[0].season),
    switchMap(([params, show]) =>
      concat(
        of(null),
        this.seasonService.getSeasonEpisodes$(show, parseInt(params.season), false, false)
      )
    ),
    skip(1),
    catchErrorAndReplay('seasonEpisodes', this.snackBar, [this.pageState])
  );

  showProgress$ = this.show$.pipe(
    switchMap((show) => concat(of(null), this.showService.getShowProgress$(show))),
    skip(1),
    catchErrorAndReplay('showProgress', this.snackBar, [this.pageState])
  );

  episodeProgress$ = combineLatest([this.params$, this.show$]).pipe(
    switchMap(([params, show]) =>
      concat(
        of(null),
        this.episodeService.getEpisodeProgress$(
          show,
          parseInt(params.season),
          parseInt(params.episode)
        )
      )
    ),
    skip(1),
    catchErrorAndReplay('episodeProgress', this.snackBar, [this.pageState])
  );

  episode$ = combineLatest([this.params$, this.show$]).pipe(
    switchMap(([params, show]) =>
      concat(
        of(null),
        this.episodeService
          .getEpisode$(show, parseInt(params.season), parseInt(params.episode), {
            fetchAlways: true,
          })
          .pipe(catchError(() => of(undefined)))
      )
    ),
    skip(1),
    tap(() => this.episodeState.next(LoadingState.SUCCESS)),
    catchErrorAndReplay('episode', this.snackBar, [this.pageState, this.episodeState])
  );

  tmdbEpisode$ = combineLatest([this.params$, this.show$]).pipe(
    switchMap(([params, show]) =>
      concat(
        of(null),
        this.tmdbService.getTmdbEpisode$(show, parseInt(params.season), parseInt(params.episode), {
          fetchAlways: true,
        })
      )
    ),
    skip(1),
    tap(() => this.episodeState.next(LoadingState.SUCCESS)),
    catchErrorAndReplay('tmdbEpisode', this.snackBar, [this.pageState, this.episodeState])
  );

  constructor(
    private route: ActivatedRoute,
    private tmdbService: TmdbService,
    private snackBar: MatSnackBar,
    private showService: ShowService,
    public episodeService: EpisodeService,
    public executeService: ExecuteService,
    private seasonService: SeasonService,
    private title: Title,
    private paramService: ParamService,
    public authService: AuthService,
    public dialogService: DialogService,
    public router: Router
  ) {
    super();
  }

  ngOnInit(): void {
    combineLatest([
      this.episode$,
      this.episodeProgress$,
      this.show$,
      this.params$,
      this.tmdbEpisode$,
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([episode, episodeProgress, show, params, tmdbEpisode]) => {
        this.title.setTitle(
          `${episodeTitle(episode, episodeProgress?.number, tmdbEpisode)}
            - ${show.title}
            - ${seasonTitle(`Season ${params.season}`)}
            - Trakify`
        );
      });

    combineLatest([this.params$, this.show$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([params, show]) => {
        this.pageState.next(LoadingState.SUCCESS);
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

    this.route.fragment.pipe(takeUntil(this.destroy$)).subscribe((fragment) => {
      if (fragment?.startsWith('poster-')) {
        const parts = fragment.split('-');
        this.dialogService.showImage(parts[1], parts[2]);
      }
    });
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.showService.activeShow$.next(undefined);
  }

  async showImage(url: string, name: string): Promise<void> {
    await this.router.navigate([], { fragment: `poster-${url}-${name}` });
  }
}

const paramSchema = z.object({
  show: z.string(),
  season: z.string(),
  episode: z.string(),
});

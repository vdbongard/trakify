import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  BehaviorSubject,
  combineLatest,
  concat,
  distinctUntilChanged,
  of,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';

import { TmdbService } from '@services/tmdb.service';
import { BaseComponent } from '@helper/base-component';
import { InfoService } from '@services/info.service';
import { ShowService } from '@services/trakt/show.service';
import { EpisodeService } from '@services/trakt/episode.service';
import { ExecuteService } from '@services/execute.service';
import { SeasonService } from '@services/trakt/season.service';

import { LoadingState } from '@type/enum';
import { BreadcrumbPart } from '@type/interfaces/Breadcrumb';
import { episodeTitle } from '../../../pipes/episode-title.pipe';
import { seasonTitle } from '../../../pipes/season-title.pipe';
import * as Paths from 'src/app/paths';
import { z } from 'zod';
import { catchErrorAndReplay } from '@operator/catchErrorAndReplay';
import { distinctUntilDeepChanged } from '@operator/distinctUntilDeepChanged';
import { ParamService } from '@services/param.service';

@Component({
  selector: 't-episode-page',
  templateUrl: './episode.component.html',
  styleUrls: ['./episode.component.scss'],
})
export class EpisodeComponent extends BaseComponent implements OnInit, OnDestroy {
  pageState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  episodeState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  seenState = new BehaviorSubject<LoadingState>(LoadingState.SUCCESS);
  state = LoadingState;
  breadcrumbParts?: BreadcrumbPart[];

  constructor(
    private route: ActivatedRoute,
    private tmdbService: TmdbService,
    private infoService: InfoService,
    private snackBar: MatSnackBar,
    private showService: ShowService,
    public episodeService: EpisodeService,
    public executeService: ExecuteService,
    private seasonService: SeasonService,
    private title: Title,
    private paramService: ParamService
  ) {
    super();
  }

  params$ = this.paramService.getParams$(this.route.params, paramSchema, this.pageState);

  show$ = this.showService.getShowByParam$(this.params$, this.pageState);

  seasonEpisodes$ = combineLatest([this.params$, this.show$]).pipe(
    distinctUntilChanged((a, b) => a[0].season === b[0].season),
    switchMap(([params, show]) =>
      this.seasonService.getSeasonEpisodes$(show, parseInt(params.season), false, false)
    ),
    distinctUntilDeepChanged(),
    catchErrorAndReplay('seasonEpisodes', this.snackBar, this.pageState)
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
    catchErrorAndReplay('episodeProgress', this.snackBar, this.pageState)
  );

  episode$ = combineLatest([this.params$, this.show$]).pipe(
    switchMap(([params, show]) =>
      concat(
        of(null),
        this.episodeService.getEpisode$(show, parseInt(params.season), parseInt(params.episode), {
          fetchAlways: true,
        })
      )
    ),
    tap((episode) => episode && this.episodeState.next(LoadingState.SUCCESS)),
    catchErrorAndReplay('episode', this.snackBar, this.pageState)
  );

  tmdbEpisode$ = combineLatest([this.params$, this.show$]).pipe(
    switchMap(([params, show]) =>
      this.tmdbService.getTmdbEpisode$(show, parseInt(params.season), parseInt(params.episode), {
        fetchAlways: true,
      })
    ),
    tap(() => this.episodeState.next(LoadingState.SUCCESS)),
    catchErrorAndReplay('tmdbEpisode', this.snackBar, this.pageState)
  );

  ngOnInit(): void {
    combineLatest([this.episode$, this.episodeProgress$, this.show$, this.params$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([episode, episodeProgress, show, params]) => {
        this.title.setTitle(
          `${episodeTitle(episode, episodeProgress?.number)}
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
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.showService.activeShow$.next(undefined);
  }
}

const paramSchema = z.object({
  show: z.string(),
  season: z.string(),
  episode: z.string(),
});

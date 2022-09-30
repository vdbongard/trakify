import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  BehaviorSubject,
  catchError,
  combineLatest,
  concat,
  distinctUntilChanged,
  map,
  of,
  shareReplay,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';

import { TmdbService } from '@services/tmdb.service';
import { BaseComponent } from '@helper/base-component';
import { InfoService } from '@services/info.service';
import { onError$ } from '@helper/error';
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
    private title: Title
  ) {
    super();
  }

  params$ = this.route.params.pipe(
    map((params) => paramSchema.parse(params)),
    tap((params) => {
      console.debug('params', params);
      this.pageState.next(LoadingState.LOADING);
      this.episodeState.next(LoadingState.LOADING);
    }),
    catchError((error) => onError$(error, this.snackBar, this.pageState)),
    shareReplay()
  );

  show$ = this.params$.pipe(
    switchMap((params) =>
      combineLatest([
        this.showService.getShowBySlug$(params.show, { fetchAlways: true }),
        of(params),
      ])
    ),
    distinctUntilChanged((a, b) => JSON.stringify(a[0]) === JSON.stringify(b[0])),
    tap(([show, params]) => {
      console.debug('show', show);
      this.showService.activeShow$.next(show);
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
    }),
    map(([show]) => show),
    catchError((error) => onError$(error, this.snackBar, this.pageState)),
    shareReplay()
  );

  seasonEpisodes$ = combineLatest([this.params$, this.show$]).pipe(
    switchMap(([params, show]) =>
      this.seasonService.getSeasonEpisodes$(show, parseInt(params.season), false, false)
    ),
    tap((seasonEpisodes) => {
      console.debug('seasonEpisodes', seasonEpisodes);
      this.pageState.next(LoadingState.SUCCESS);
    }),
    catchError((error) => onError$(error, this.snackBar, this.pageState)),
    shareReplay()
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
    tap((episodeProgress) => {
      if (!episodeProgress) return;
      console.debug('episodeProgress', episodeProgress);
    }),
    catchError((error) => onError$(error, this.snackBar, this.pageState)),
    shareReplay()
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
    tap((episode) => {
      if (!episode) return;
      console.debug('episode', episode);
      this.episodeState.next(LoadingState.SUCCESS);
    }),
    catchError((error) => onError$(error, this.snackBar, this.pageState)),
    shareReplay()
  );

  tmdbEpisode$ = combineLatest([this.params$, this.show$]).pipe(
    switchMap(([params, show]) =>
      this.tmdbService.getTmdbEpisode$(show, parseInt(params.season), parseInt(params.episode), {
        fetchAlways: true,
      })
    ),
    tap((tmdbEpisode) => {
      console.debug('tmdbEpisode', tmdbEpisode);
      this.episodeState.next(LoadingState.SUCCESS);
    }),
    catchError((error) => onError$(error, this.snackBar, this.pageState)),
    shareReplay()
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

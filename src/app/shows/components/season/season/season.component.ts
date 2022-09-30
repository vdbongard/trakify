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

import { BaseComponent } from '@helper/base-component';
import { onError$ } from '@helper/error';
import { ShowService } from '@services/trakt/show.service';
import { SeasonService } from '@services/trakt/season.service';
import { ExecuteService } from '@services/execute.service';

import { LoadingState } from '@type/enum';
import { BreadcrumbPart } from '@type/interfaces/Breadcrumb';
import { seasonTitle } from '../../../pipes/season-title.pipe';
import * as Paths from 'src/app/paths';
import { z } from 'zod';
import { EpisodeFull } from '@type/interfaces/Trakt';

@Component({
  selector: 't-season',
  templateUrl: './season.component.html',
  styleUrls: ['./season.component.scss'],
})
export class SeasonComponent extends BaseComponent implements OnInit, OnDestroy {
  pageState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  breadcrumbParts?: BreadcrumbPart[];
  paths = Paths;

  params$ = this.route.params.pipe(
    map((params) => paramSchema.parse(params)),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
    tap((params) => console.debug('params', params)),
    catchError((error) => onError$(error, this.snackBar, this.pageState)),
    shareReplay()
  );

  show$ = this.params$.pipe(
    switchMap((params) => this.showService.getShowBySlug$(params.show, { fetchAlways: true })),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
    tap(async (show) => {
      console.debug('show', show);
      this.showService.activeShow$.next(show);
    }),
    catchError((error) => onError$(error, this.snackBar, this.pageState)),
    shareReplay()
  );

  seasonProgress$ = this.params$.pipe(
    switchMap((params) => combineLatest([of(params), this.show$])),
    switchMap(([params, show]) =>
      combineLatest([
        this.seasonService.getSeasonProgress$(show, parseInt(params.season)),
        of(show),
        of(params),
      ])
    ),
    tap(([seasonProgress, show, params]) => {
      console.debug('seasonProgress', seasonProgress);
      this.pageState.next(LoadingState.SUCCESS);
      this.title.setTitle(
        `${seasonTitle(seasonProgress?.title ?? `Season ${params.season}`)}
            - ${show.title}
            - Trakify`
      );
    }),
    map(([seasonProgress]) => seasonProgress),
    catchError((error) => onError$(error, this.snackBar, this.pageState)),
    shareReplay()
  );

  seasons$ = this.show$.pipe(
    switchMap((show) => this.seasonService.fetchSeasons(show)),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
    tap((seasons) => console.debug('seasons', seasons)),
    catchError((error) => onError$(error, this.snackBar, this.pageState)),
    shareReplay()
  );

  seasonEpisodes$ = combineLatest([this.params$, this.show$]).pipe(
    switchMap(([params, show]) =>
      concat(
        of(null),
        this.seasonService.getSeasonEpisodes$<EpisodeFull>(show, parseInt(params.season))
      )
    ),
    tap((seasonEpisodes) => {
      if (!seasonEpisodes) return;
      console.debug('seasonEpisodes', seasonEpisodes);
    }),
    catchError((error) => onError$(error, this.snackBar, this.pageState)),
    shareReplay()
  );

  constructor(
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private showService: ShowService,
    public seasonService: SeasonService,
    public executeService: ExecuteService,
    private title: Title
  ) {
    super();
  }

  ngOnInit(): void {
    combineLatest([this.params$, this.show$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([params, show]) => {
        this.breadcrumbParts = [
          {
            name: show.title,
            link: Paths.show({ show: params.show }),
          },
          {
            name: seasonTitle(`Season ${params.season}`),
            link: Paths.season({ show: params.show, season: params.season }),
          },
        ];
      });

    combineLatest([this.seasons$, this.seasonProgress$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([seasons, seasonProgress]) => {
        if (!seasonProgress) return;
        const season = seasons.find((season) => season.number === seasonProgress.number);
        this.seasonService.activeSeason$.next(season);
      });
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.showService.activeShow$.next(undefined);
    this.seasonService.activeSeason$.next(undefined);
  }
}

const paramSchema = z.object({
  show: z.string(),
  season: z.string(),
});

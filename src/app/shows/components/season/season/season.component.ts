import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  BehaviorSubject,
  combineLatest,
  concat,
  distinctUntilKeyChanged,
  map,
  of,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';

import { BaseComponent } from '@helper/base-component';
import { ShowService } from '@services/trakt/show.service';
import { SeasonService } from '@services/trakt/season.service';
import { ExecuteService } from '@services/execute.service';

import { LoadingState } from '@type/enum';
import { BreadcrumbPart } from '@type/interfaces/Breadcrumb';
import { seasonTitle } from '../../../pipes/season-title.pipe';
import * as Paths from 'src/app/paths';
import { z } from 'zod';
import { EpisodeFull } from '@type/interfaces/Trakt';
import { wait } from '@helper/wait';
import { catchErrorAndReplay } from '@helper/catchErrorAndReplay.operator';
import { distinctUntilDeepChanged } from '@helper/distinctUntilDeepChanged.operator';

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
    distinctUntilDeepChanged(),
    catchErrorAndReplay('params', this.snackBar, this.pageState)
  );

  show$ = this.params$.pipe(
    distinctUntilKeyChanged('show'),
    switchMap((params) => this.showService.getShowBySlug$(params.show, { fetchAlways: true })),
    distinctUntilDeepChanged(),
    tap(async (show) => this.showService.activeShow$.next(show)),
    catchErrorAndReplay('show', this.snackBar, this.pageState)
  );

  seasonProgress$ = combineLatest([this.params$, this.show$]).pipe(
    switchMap(([params, show]) =>
      this.seasonService.getSeasonProgress$(show, parseInt(params.season))
    ),
    tap(() => this.pageState.next(LoadingState.SUCCESS)),
    catchErrorAndReplay('seasonProgress', this.snackBar, this.pageState)
  );

  seasons$ = this.show$.pipe(
    switchMap((show) => this.seasonService.fetchSeasons(show)),
    distinctUntilDeepChanged(),
    catchErrorAndReplay('seasons', this.snackBar, this.pageState)
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
    catchErrorAndReplay('seasonEpisodes', this.snackBar, this.pageState)
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

    combineLatest([this.params$, this.show$, this.seasonProgress$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(async ([params, show, seasonProgress]) => {
        await wait(); // otherwise title will be overridden by default route title
        this.title.setTitle(
          `${seasonTitle(seasonProgress?.title ?? `Season ${params.season}`)}
            - ${show.title}
            - Trakify`
        );
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

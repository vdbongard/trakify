import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, combineLatest, concat, of, switchMap, takeUntil, tap } from 'rxjs';

import { Base } from '@helper/base';
import { ShowService } from '../../data/show.service';
import { SeasonService } from '../../data/season.service';
import { ExecuteService } from '@services/execute.service';

import { LoadingState } from '@type/enum';
import { BreadcrumbPart } from '@type/interfaces/Breadcrumb';
import { seasonTitle } from '../../utils/pipes/season-title.pipe';
import * as Paths from '@shared/paths';
import { z } from 'zod';
import { wait } from '@helper/wait';
import { catchErrorAndReplay } from '@operator/catchErrorAndReplay';
import { ParamService } from '@services/param.service';
import { EpisodeFull } from '@type/interfaces/Trakt';
import { AuthService } from '@services/auth.service';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { AsyncPipe, NgIf } from '@angular/common';
import { SeasonHeaderComponent } from '../../ui/season-header/season-header.component';
import { SeasonEpisodesComponent } from '../../ui/season-episodes/season-episodes.component';

@Component({
  selector: 't-season',
  templateUrl: './season.component.html',
  styleUrls: ['./season.component.scss'],
  standalone: true,
  imports: [LoadingComponent, NgIf, SeasonHeaderComponent, SeasonEpisodesComponent, AsyncPipe],
})
export class SeasonComponent extends Base implements OnInit, OnDestroy {
  pageState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  breadcrumbParts?: BreadcrumbPart[];
  paths = Paths;

  params$ = this.paramService.params$(this.route.params, paramSchema, this.pageState);

  show$ = this.showService.show$(this.params$, this.pageState);

  seasonProgress$ = combineLatest([this.params$, this.show$]).pipe(
    switchMap(([params, show]) =>
      concat(of(null), this.seasonService.getSeasonProgress$(show, parseInt(params.season)))
    ),
    tap(() => this.pageState.next(LoadingState.SUCCESS)),
    catchErrorAndReplay('seasonProgress', this.snackBar, this.pageState)
  );

  seasons$ = this.show$.pipe(
    switchMap((show) => concat(of(null), this.seasonService.fetchSeasons(show))),
    catchErrorAndReplay('seasons', this.snackBar, this.pageState)
  );

  seasonEpisodes$ = combineLatest([this.params$, this.show$]).pipe(
    switchMap(([params, show]) =>
      concat(
        of(null),
        this.seasonService.getSeasonEpisodes$<EpisodeFull>(show, parseInt(params.season))
      )
    ),
    catchErrorAndReplay('seasonEpisodes', this.snackBar, this.pageState)
  );

  constructor(
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private showService: ShowService,
    public seasonService: SeasonService,
    public executeService: ExecuteService,
    private title: Title,
    private paramService: ParamService,
    public authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    super();
  }

  ngOnInit(): void {
    combineLatest([this.params$, this.show$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([params, show]) => {
        this.cdr.markForCheck();
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
        this.cdr.markForCheck();
        const season = seasons?.find((season) => season.number === seasonProgress.number);
        this.seasonService.activeSeason$.next(season);
      });

    combineLatest([this.params$, this.show$, this.seasonProgress$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(async ([params, show, seasonProgress]) => {
        await wait(); // otherwise title will be overridden by default route title
        this.cdr.markForCheck();
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

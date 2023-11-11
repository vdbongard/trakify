import { Component, computed, inject, OnDestroy, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { combineLatest, concat, of, switchMap, tap } from 'rxjs';
import { ShowService } from '../../data/show.service';
import { SeasonService } from '../../data/season.service';
import { ExecuteService } from '@services/execute.service';
import { LoadingState } from '@type/Enum';
import { BreadcrumbPart } from '@type/Breadcrumb';
import * as Paths from '@shared/paths';
import { z } from 'zod';
import { wait } from '@helper/wait';
import { catchErrorAndReplay } from '@operator/catchErrorAndReplay';
import { ParamService } from '@services/param.service';
import { EpisodeFull } from '@type/Trakt';
import { AuthService } from '@services/auth.service';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { SeasonHeaderComponent } from './ui/season-header/season-header.component';
import { SeasonEpisodesComponent } from './ui/season-episodes/season-episodes.component';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { seasonTitle } from '@helper/seasonTitle';

@Component({
  selector: 't-season',
  standalone: true,
  imports: [LoadingComponent, SeasonHeaderComponent, SeasonEpisodesComponent],
  templateUrl: './season.component.html',
  styleUrl: './season.component.scss',
})
export default class SeasonComponent implements OnDestroy {
  route = inject(ActivatedRoute);
  snackBar = inject(MatSnackBar);
  showService = inject(ShowService);
  seasonService = inject(SeasonService);
  executeService = inject(ExecuteService);
  title = inject(Title);
  paramService = inject(ParamService);
  authService = inject(AuthService);

  pageState = signal(LoadingState.LOADING);
  episodesLoadingState = signal(LoadingState.LOADING);
  breadcrumbParts?: BreadcrumbPart[];

  params$ = this.paramService.params$(this.route.params, paramSchema, [this.pageState]);
  params = toSignal(this.params$);
  seasonNumber = computed(() => this.params()?.season ?? '');
  showSlug = computed(() => this.params()?.show ?? '');

  show$ = this.showService.show$(this.params$, [this.pageState]);
  show = toSignal(this.show$);

  seasonProgress$ = combineLatest([this.params$, this.show$]).pipe(
    switchMap(([params, show]) =>
      concat(of(null), this.seasonService.getSeasonProgress$(show, parseInt(params.season))),
    ),
    tap(() => this.pageState.set(LoadingState.SUCCESS)),
    catchErrorAndReplay('seasonProgress', this.snackBar, [this.pageState]),
  );
  seasonProgress = toSignal(this.seasonProgress$);

  seasons$ = this.show$.pipe(
    switchMap((show) => concat(of(null), this.seasonService.fetchSeasons(show))),
    catchErrorAndReplay('seasons', this.snackBar, [this.pageState]),
  );
  seasons = toSignal(this.seasons$);

  seasonEpisodes = toSignal(
    combineLatest([this.params$, this.show$]).pipe(
      switchMap(([params, show]) =>
        concat(
          of(null),
          this.seasonService.getSeasonEpisodes$<EpisodeFull>(show, parseInt(params.season)),
        ),
      ),
      tap(() => this.episodesLoadingState.set(LoadingState.SUCCESS)),
      catchErrorAndReplay('seasonEpisodes', this.snackBar, [this.episodesLoadingState]),
    ),
  );

  constructor() {
    combineLatest([this.params$, this.show$])
      .pipe(takeUntilDestroyed())
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
      .pipe(takeUntilDestroyed())
      .subscribe(([seasons, seasonProgress]) => {
        if (!seasonProgress) return;
        const season = seasons?.find((season) => season.number === seasonProgress.number);
        this.seasonService.activeSeason.set(season ? { ...season } : season);
      });

    combineLatest([this.params$, this.show$, this.seasonProgress$])
      .pipe(takeUntilDestroyed())
      .subscribe(async ([params, show, seasonProgress]) => {
        await wait(); // otherwise title will be overridden by default route title
        this.title.setTitle(
          `${seasonTitle(seasonProgress?.title ?? `Season ${params.season}`)}
            - ${show.title}
            - Trakify`,
        );
      });
  }

  ngOnDestroy(): void {
    this.showService.activeShow.set(undefined);
    this.seasonService.activeSeason.set(undefined);
  }
}

const paramSchema = z.object({
  show: z.string(),
  season: z.string(),
});

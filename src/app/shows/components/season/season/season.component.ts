import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, catchError, combineLatest, map, of, switchMap, takeUntil } from 'rxjs';

import { BaseComponent } from '../../../../shared/helper/base-component';
import { BreadcrumbPart } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { onError } from '../../../../shared/helper/error';
import { ShowService } from '../../../../shared/services/trakt/show.service';
import { SeasonService } from '../../../../shared/services/trakt/season.service';
import { ExecuteService } from '../../../../shared/services/execute.service';

import { LoadingState } from '../../../../../types/enum';

import type { SeasonInfo } from '../../../../../types/interfaces/Show';
import type { EpisodeFull } from '../../../../../types/interfaces/Trakt';

@Component({
  selector: 't-season',
  templateUrl: './season.component.html',
  styleUrls: ['./season.component.scss'],
})
export class SeasonComponent extends BaseComponent implements OnInit, OnDestroy {
  loadingState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  episodesLoadingState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  seasonInfo?: SeasonInfo;
  breadcrumbParts?: BreadcrumbPart[];
  params?: ParamMap;

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
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          if (!params.has('slug') || !params.has('season')) throw Error('Param is empty');
          this.params = params;
          return this.showService.getIdsBySlug$(params.get('slug'), { fetch: true });
        }),
        switchMap((ids) => {
          if (!ids) throw Error('Ids is empty');
          return combineLatest([
            this.seasonService.getSeasonProgress$(ids, parseInt(this.params?.get('season') ?? '')),
            this.showService.getShow$(ids, { fetch: true }).pipe(catchError(() => of(undefined))),
            this.seasonService.fetchSeasons$(ids.trakt).pipe(catchError(() => of(undefined))),
            of(ids),
          ]);
        }),
        switchMap(([seasonProgress, show, seasons, ids]) => {
          if (!show) throw Error('Show is empty');

          this.loadingState.next(LoadingState.SUCCESS);

          this.seasonInfo = {
            seasonProgress,
            show,
            seasons,
          };

          this.title.setTitle(
            `${this.seasonService.getSeasonTitle(
              this.seasonInfo.seasonProgress?.title ?? `Season ${this.params?.get('season')}`
            )}
            - ${show.title}
            - Trakify`
          );

          this.showService.activeShow.next(show);
          this.seasonService.activeSeason.next(
            seasons?.find((season) => season.number === seasonProgress?.number)
          );

          if (this.params) {
            this.breadcrumbParts = [
              {
                name: show.title,
                link: `/series/s/${this.params.get('slug')}`,
              },
              {
                name: this.seasonService.getSeasonTitle(`Season ${this.params.get('season')}`),
                link: `/series/s/${this.params.get('slug')}/season/${this.params.get('season')}`,
              },
            ];
          }

          return this.seasonService.getSeasonEpisodes$(
            ids,
            parseInt(this.params?.get('season') ?? '')
          );
        }),
        map((episodes) => {
          this.seasonInfo = {
            ...this.seasonInfo,
            episodes: episodes as EpisodeFull[],
          };
          console.debug('seasonInfo', this.seasonInfo);
          this.episodesLoadingState.next(LoadingState.SUCCESS);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({ error: (error) => onError(error, this.snackBar, this.loadingState) });
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.showService.activeShow.next(undefined);
    this.seasonService.activeSeason.next(undefined);
  }
}

import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, combineLatest, map, of, switchMap, takeUntil } from 'rxjs';

import { BaseComponent } from '@helper/base-component';
import { onError } from '@helper/error';
import { ShowService } from '@services/trakt/show.service';
import { SeasonService } from '@services/trakt/season.service';
import { ExecuteService } from '@services/execute.service';

import { LoadingState } from '@type/enum';

import type { SeasonInfo } from '@type/interfaces/Show';
import type { EpisodeFull } from '@type/interfaces/Trakt';
import { BreadcrumbPart } from '@type/interfaces/Breadcrumb';
import { seasonTitle } from '../../../pipes/season-title.pipe';

@Component({
  selector: 't-season',
  templateUrl: './season.component.html',
  styleUrls: ['./season.component.scss'],
})
export class SeasonComponent extends BaseComponent implements OnInit, OnDestroy {
  pageState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  episodesLoadingState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  seasonInfo?: SeasonInfo;
  breadcrumbParts?: BreadcrumbPart[];
  params?: Params;

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
    this.route.params
      .pipe(
        switchMap((params) => {
          if (!params['slug'] || !params['season']) throw Error('Param is empty');
          this.params = params;
          return this.showService.getIdsBySlug$(params['slug'], { fetch: true });
        }),
        switchMap((ids) => {
          if (!ids) throw Error('Ids is empty');
          return combineLatest([
            this.seasonService.getSeasonProgress$(ids, parseInt(this.params?.['season'] ?? '')),
            this.showService.getShow$(ids, { fetch: true }),
            this.seasonService.fetchSeasons$(ids.trakt),
            of(ids),
          ]);
        }),
        switchMap(([seasonProgress, show, seasons, ids]) => {
          if (!show) throw Error('Show is empty');

          this.pageState.next(LoadingState.SUCCESS);

          this.seasonInfo = {
            seasonProgress,
            show,
            seasons,
          };

          this.title.setTitle(
            `${seasonTitle(
              this.seasonInfo.seasonProgress?.title ?? `Season ${this.params?.['season']}`
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
                link: `/series/s/${this.params['slug']}`,
              },
              {
                name: seasonTitle(`Season ${this.params['season']}`),
                link: `/series/s/${this.params['slug']}/season/${this.params['season']}`,
              },
            ];
          }

          return this.seasonService.getSeasonEpisodes$(
            ids,
            parseInt(this.params?.['season'] ?? '')
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
      .subscribe({ error: (error) => onError(error, this.snackBar, this.pageState) });
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.showService.activeShow.next(undefined);
    this.seasonService.activeSeason.next(undefined);
  }
}

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
import * as Paths from 'src/app/paths';

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
  paths = Paths;

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
          if (!params['slug'] || !params['season']) throw Error('Param is empty (SeasonComponent)');
          this.params = params;
          return this.showService.getShowBySlug$(params['slug'], { fetchAlways: true });
        }),
        switchMap((show) => {
          if (!show) throw Error('Show is empty (SeasonComponent)');
          return combineLatest([
            this.seasonService.getSeasonProgress$(show, parseInt(this.params?.['season'] ?? '')),
            this.seasonService.fetchSeasons(show.ids.trakt),
            of(show),
          ]);
        }),
        switchMap(([seasonProgress, seasons, show]) => {
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
                link: Paths.show({ slug: this.params['slug'] }),
              },
              {
                name: seasonTitle(`Season ${this.params['season']}`),
                link: Paths.season({ slug: this.params['slug'], season: this.params['season'] }),
              },
            ];
          }

          return this.seasonService.getSeasonEpisodes$(
            show,
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

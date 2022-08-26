import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, catchError, combineLatest, map, of, switchMap, takeUntil } from 'rxjs';
import { ActivatedRoute, Params } from '@angular/router';
import { BaseComponent } from '../../../../shared/helper/base-component';
import { SeasonInfo } from '../../../../../types/interfaces/Show';
import { BreadcrumbPart } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { LoadingState } from '../../../../../types/enum';
import { onError } from '../../../../shared/helper/error';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ShowService } from '../../../../shared/services/trakt/show.service';
import { SeasonService } from '../../../../shared/services/trakt/season.service';
import { Season0AsSpecialsPipe } from '../../../pipes/season0-as-specials.pipe';
import { ExecuteService } from '../../../../shared/services/execute.service';
import { EpisodeFull } from '../../../../../types/interfaces/Trakt';

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
  params?: Params;

  constructor(
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private showService: ShowService,
    private seasonService: SeasonService,
    public executeService: ExecuteService
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
            this.seasonService.getSeasonProgress$(ids, parseInt(this.params?.['season'])),
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
                name: new Season0AsSpecialsPipe().transform(`Season ${this.params!['season']}`),
                link: `/series/s/${this.params['slug']}/season/${this.params['season']}`,
              },
            ];
          }

          return this.seasonService.getSeasonEpisodes$(ids, parseInt(this.params?.['season']));
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

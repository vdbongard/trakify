import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, catchError, combineLatest, of, switchMap, takeUntil } from 'rxjs';
import { ActivatedRoute, Params } from '@angular/router';
import { BaseComponent } from '../../../../helper/base-component';
import { SeasonInfo } from '../../../../../types/interfaces/Show';
import { BreadcrumbPart } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { LoadingState } from '../../../../../types/enum';
import { onError } from '../../../../helper/error';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ShowService } from '../../../../services/trakt/show.service';
import { SeasonService } from '../../../../services/trakt/season.service';
import { TmdbService } from '../../../../services/tmdb.service';

@Component({
  selector: 'app-season',
  templateUrl: './season.component.html',
  styleUrls: ['./season.component.scss'],
})
export class SeasonComponent extends BaseComponent implements OnInit {
  loadingState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  seasonInfo?: SeasonInfo;
  breadcrumbParts?: BreadcrumbPart[];
  params?: Params;

  constructor(
    private route: ActivatedRoute,
    private snackBar: MatSnackBar,
    private showService: ShowService,
    private seasonService: SeasonService,
    private tmdbService: TmdbService
  ) {
    super();
  }

  ngOnInit(): void {
    this.route.params
      .pipe(
        switchMap((params) => {
          if (!params['slug'] || !params['season']) throw Error('Param is empty');
          this.params = params;
          return this.showService.getIdsBySlug$(params['slug'], true);
        }),
        switchMap((ids) => {
          if (!ids) throw Error('Ids is empty');
          return combineLatest([
            this.seasonService.getSeasonProgress$(ids, parseInt(this.params?.['season'])),
            this.showService.getShow$(ids, false, true).pipe(catchError(() => of(undefined))),
            this.tmdbService.getTmdbShow$(ids, false, true).pipe(catchError(() => of(undefined))),
            of(ids),
          ]);
        }),
        switchMap(([seasonProgress, show, tmdbShow, ids]) => {
          this.seasonInfo = {
            seasonProgress,
            show,
          };

          if (show && this.params) {
            this.breadcrumbParts = [
              {
                name: show.title,
                link: `/series/s/${this.params['slug']}`,
              },
              {
                name: `Season ${this.params!['season']}`,
                link: `/series/s/${this.params['slug']}/season/${this.params['season']}`,
              },
            ];
          }

          const episodeCount = seasonProgress
            ? seasonProgress.episodes.length
            : tmdbShow?.seasons.find((season) => season.season_number === this.params?.['season'])
                ?.episode_count;

          return combineLatest([
            this.seasonService
              .getSeasonEpisodes$(ids, parseInt(this.params?.['season']), episodeCount, false, true)
              .pipe(catchError(() => of(undefined))),
          ]);
        }),
        switchMap(([episodes]) => {
          this.seasonInfo = {
            ...this.seasonInfo,
            episodes,
          };
          return of(undefined);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: () => this.loadingState.next(LoadingState.SUCCESS),
        error: (error) => onError(error, this.snackBar, this.loadingState),
      });
  }
}

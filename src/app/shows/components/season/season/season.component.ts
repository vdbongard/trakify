import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, catchError, combineLatest, of, switchMap, takeUntil } from 'rxjs';
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
import { SyncService } from '../../../../shared/services/sync.service';

@Component({
  selector: 'app-season',
  templateUrl: './season.component.html',
  styleUrls: ['./season.component.scss'],
})
export class SeasonComponent extends BaseComponent implements OnInit {
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
    public syncService: SyncService
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
            of(ids),
          ]);
        }),
        switchMap(([seasonProgress, show, ids]) => {
          if (!show) throw Error('Show is empty');

          this.loadingState.next(LoadingState.SUCCESS);

          this.seasonInfo = {
            seasonProgress,
            show,
          };

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
        switchMap((episodes) => {
          this.seasonInfo = {
            ...this.seasonInfo,
            episodes,
          };
          console.debug('this.seasonInfo', this.seasonInfo);
          this.episodesLoadingState.next(LoadingState.SUCCESS);
          return of(undefined);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        error: (error) => onError(error, this.snackBar, this.loadingState),
      });
  }
}

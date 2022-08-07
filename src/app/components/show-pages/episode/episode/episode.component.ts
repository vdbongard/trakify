import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { SyncService } from '../../../../shared/services/sync.service';
import { TmdbService } from '../../../../shared/services/tmdb.service';
import { BaseComponent } from '../../../../shared/helper/base-component';
import { BehaviorSubject, combineLatest, of, switchMap, takeUntil } from 'rxjs';
import { EpisodeInfo } from '../../../../../types/interfaces/Show';
import { BreadcrumbPart } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { InfoService } from '../../../../shared/services/info.service';
import { LoadingState } from '../../../../../types/enum';
import { onError } from '../../../../shared/helper/error';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ShowService } from '../../../../shared/services/trakt/show.service';
import { EpisodeService } from '../../../../shared/services/trakt/episode.service';
import { Season0AsSpecialsPipe } from '../../../../shared/pipes/season0-as-specials.pipe';

@Component({
  selector: 'app-episode-page',
  templateUrl: './episode.component.html',
  styleUrls: ['./episode.component.scss'],
})
export class EpisodeComponent extends BaseComponent implements OnInit, OnDestroy {
  loadingState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  episodeInfo?: EpisodeInfo;
  breadcrumbParts?: BreadcrumbPart[];
  stillPrefix?: string;
  params?: Params;

  constructor(
    public syncService: SyncService,
    private route: ActivatedRoute,
    private tmdbService: TmdbService,
    private infoService: InfoService,
    private snackBar: MatSnackBar,
    private showService: ShowService,
    private episodeService: EpisodeService
  ) {
    super();
  }

  ngOnInit(): void {
    this.route.params
      .pipe(
        switchMap((params) => {
          if (!params['slug'] || !params['season'] || !params['episode'])
            throw Error('Param is empty');
          this.params = params;
          return this.showService.getIdsBySlug$(params['slug'], true);
        }),
        switchMap((ids) => {
          if (!ids) throw Error('Ids is empty');
          return combineLatest([
            this.episodeService.getEpisodeProgress$(
              ids,
              parseInt(this.params?.['season']),
              parseInt(this.params?.['episode'])
            ),
            this.showService.getShow$(ids, false, true),
            this.episodeService.getEpisode$(
              ids,
              parseInt(this.params?.['season']),
              parseInt(this.params?.['episode']),
              false,
              true
            ),
            this.tmdbService.getTmdbEpisode$(
              ids.tmdb,
              parseInt(this.params?.['season']),
              parseInt(this.params?.['episode']),
              false,
              true
            ),
          ]);
        }),
        switchMap(([episodeProgress, show, episode, tmdbEpisode]) => {
          if (!show) throw Error('Show is empty');

          this.loadingState.next(LoadingState.SUCCESS);

          this.episodeInfo = {
            episodeProgress,
            show,
            episode,
            tmdbEpisode,
          };

          if (this.params) {
            this.breadcrumbParts = [
              {
                name: show.title,
                link: `/series/s/${this.params['slug']}`,
              },
              {
                name: new Season0AsSpecialsPipe().transform(`Season ${this.params['season']}`),
                link: `/series/s/${this.params['slug']}/season/${this.params['season']}`,
              },
              {
                name: `Episode ${this.params['episode']}`,
                link: `/series/s/${this.params['slug']}/season/${this.params['season']}/episode/${this.params['episode']}`,
              },
            ];
          }
          return of(undefined);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        error: (error) => onError(error, this.snackBar, this.loadingState),
      });

    this.tmdbService.tmdbConfig$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (tmdbConfig) => {
        if (!tmdbConfig) return;
        this.stillPrefix = tmdbConfig.images.secure_base_url + tmdbConfig.images.still_sizes[3];
      },
      error: (error) => onError(error, this.snackBar, this.loadingState),
    });
  }
}

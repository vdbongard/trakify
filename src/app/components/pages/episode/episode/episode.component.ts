import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import { SyncService } from '../../../../services/sync.service';
import { TmdbService } from '../../../../services/tmdb.service';
import { BaseComponent } from '../../../../helper/base-component';
import { BehaviorSubject, switchMap, takeUntil } from 'rxjs';
import { EpisodeInfo } from '../../../../../types/interfaces/Show';
import { BreadcrumbPart } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { InfoService } from '../../../../services/info.service';
import { LoadingState } from '../../../../../types/enum';
import { onError } from '../../../../helper/error';
import { MatSnackBar } from '@angular/material/snack-bar';

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
    private snackBar: MatSnackBar
  ) {
    super();
  }

  ngOnInit(): void {
    this.route.params
      .pipe(
        switchMap((params) => {
          this.params = params;
          return this.infoService.getEpisodeInfo$(
            params['slug'],
            parseInt(params['season']),
            parseInt(params['episode'])
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: async (episodeInfo) => {
          this.episodeInfo = episodeInfo;
          this.breadcrumbParts = [
            {
              name: episodeInfo?.show?.title,
              link: `/series/s/${this.params?.['slug']}`,
            },
            {
              name: `Season ${this.params?.['season']}`,
              link: `/series/s/${this.params?.['slug']}/season/${this.params?.['season']}`,
            },
            {
              name: `Episode ${this.params?.['episode']}`,
              link: `/series/s/${this.params?.['slug']}/season/${this.params?.['season']}/episode/${this.params?.['episode']}`,
            },
          ];
          this.loadingState.next(LoadingState.SUCCESS);
        },
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

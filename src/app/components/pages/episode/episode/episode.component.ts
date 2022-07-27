import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SyncService } from '../../../../services/sync.service';
import { TmdbService } from '../../../../services/tmdb.service';
import { BaseComponent } from '../../../../helper/base-component';
import { BehaviorSubject, switchMap, takeUntil } from 'rxjs';
import { EpisodeInfo } from '../../../../../types/interfaces/Show';
import { BreadcrumbPart } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { InfoService } from '../../../../services/info.service';
import { LoadingState } from '../../../../../types/enum';

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

  constructor(
    public syncService: SyncService,
    private route: ActivatedRoute,
    private tmdbService: TmdbService,
    private infoService: InfoService
  ) {
    super();
  }

  ngOnInit(): void {
    this.route.params
      .pipe(
        switchMap((params) =>
          this.infoService.getEpisodeInfo$(
            params['slug'],
            parseInt(params['season']),
            parseInt(params['episode'])
          )
        ),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: async (episodeInfo) => {
          this.episodeInfo = episodeInfo;
          this.breadcrumbParts = [
            {
              name: episodeInfo?.show?.title,
              link: `/series/s/${episodeInfo?.show?.ids.slug}`,
            },
            {
              name: `Season ${episodeInfo?.episode?.season}`,
              link: `/series/s/${episodeInfo?.show?.ids.slug}/season/${episodeInfo?.episode?.season}`,
            },
            {
              name: `Episode ${episodeInfo?.episode?.number}`,
              link: `/series/s/${episodeInfo?.show?.ids.slug}/season/${episodeInfo?.episode?.season}/episode/${episodeInfo?.episode?.number}`,
            },
          ];
          this.loadingState.next(LoadingState.SUCCESS);
        },
        error: () => this.loadingState.next(LoadingState.ERROR),
      });

    this.tmdbService.tmdbConfig$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (tmdbConfig) => {
        if (!tmdbConfig) return;
        this.stillPrefix = tmdbConfig.images.secure_base_url + tmdbConfig.images.still_sizes[3];
      },
      error: () => this.loadingState.next(LoadingState.ERROR),
    });
  }
}

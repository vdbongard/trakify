import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ShowService } from '../../../../services/show.service';
import { SyncService } from '../../../../services/sync.service';
import { TmdbService } from '../../../../services/tmdb.service';
import { BaseComponent } from '../../../../helper/base-component';
import { switchMap, takeUntil } from 'rxjs';
import { EpisodeInfo } from '../../../../../types/interfaces/Show';
import { TmdbConfiguration } from '../../../../../types/interfaces/Tmdb';
import { BreadcrumbPart } from '../../../../shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-episode-page',
  templateUrl: './episode.component.html',
  styleUrls: ['./episode.component.scss'],
})
export class EpisodeComponent extends BaseComponent implements OnInit, OnDestroy {
  episodeInfo?: EpisodeInfo;
  breadcrumbParts?: BreadcrumbPart[];
  tmdbConfig?: TmdbConfiguration;

  constructor(
    private route: ActivatedRoute,
    public showService: ShowService,
    public syncService: SyncService,
    private tmdbService: TmdbService
  ) {
    super();
  }

  ngOnInit(): void {
    this.route.params
      .pipe(
        switchMap((params) => {
          return this.showService.getEpisodeInfo$(
            params['slug'],
            parseInt(params['season']),
            parseInt(params['episode'])
          );
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(async (episodeInfo) => {
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
      });

    this.tmdbService.tmdbConfig$
      .pipe(takeUntil(this.destroy$))
      .subscribe((config) => (this.tmdbConfig = config));
  }
}

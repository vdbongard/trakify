import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, combineLatest, map, of, switchMap, takeUntil } from 'rxjs';

import { TmdbService } from '../../../../shared/services/tmdb.service';
import { BaseComponent } from '../../../../shared/helper/base-component';
import { BreadcrumbPart } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { InfoService } from '../../../../shared/services/info.service';
import { onError } from '../../../../shared/helper/error';
import { ShowService } from '../../../../shared/services/trakt/show.service';
import { EpisodeService } from '../../../../shared/services/trakt/episode.service';
import { ExecuteService } from '../../../../shared/services/execute.service';
import { SeasonService } from '../../../../shared/services/trakt/season.service';

import { LoadingState } from 'src/types/enum';

import type { EpisodeInfo } from 'src/types/interfaces/Show';

@Component({
  selector: 't-episode-page',
  templateUrl: './episode.component.html',
  styleUrls: ['./episode.component.scss'],
})
export class EpisodeComponent extends BaseComponent implements OnInit, OnDestroy {
  pageState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  seenState = new BehaviorSubject<LoadingState>(LoadingState.SUCCESS);
  state = LoadingState;
  episodeInfo?: EpisodeInfo;
  breadcrumbParts?: BreadcrumbPart[];
  stillPrefix?: string;
  params?: Params;

  constructor(
    private route: ActivatedRoute,
    private tmdbService: TmdbService,
    private infoService: InfoService,
    private snackBar: MatSnackBar,
    private showService: ShowService,
    public episodeService: EpisodeService,
    public executeService: ExecuteService,
    private seasonService: SeasonService,
    private title: Title
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
          this.episodeInfo = undefined;
          return this.showService.getIdsBySlug$(params['slug'], { fetch: true });
        }),
        switchMap((ids) => {
          if (!ids) throw Error('Ids is empty');
          return combineLatest([
            of(ids),
            this.showService.getShow$(ids, { fetch: true }),
            this.seasonService.getSeasonEpisodes$(
              ids,
              parseInt(this.params?.['season'] ?? undefined),
              false,
              false
            ),
          ]);
        }),
        switchMap(([ids, show, episodes]) => {
          if (!this.params) throw Error('Params is empty');
          if (!show) throw Error('Show is empty');

          this.breadcrumbParts = [
            {
              name: show.title,
              link: `/series/s/${this.params['slug']}`,
            },
            {
              name: this.seasonService.getSeasonTitle(`Season ${this.params['season']}`),
              link: `/series/s/${this.params['slug']}/season/${this.params['season']}`,
            },
            {
              name: `Episode ${this.params['episode']}`,
              link: `/series/s/${this.params['slug']}/season/
                  ${this.params['season']}/episode/${this.params['episode']}`,
            },
          ];

          return combineLatest([
            this.episodeService.getEpisodeProgress$(
              ids,
              parseInt(this.params['season'] ?? ''),
              parseInt(this.params['episode'] ?? '')
            ),
            of(show),
            this.episodeService.getEpisode$(
              ids,
              parseInt(this.params['season'] ?? ''),
              parseInt(this.params['episode'] ?? ''),
              { fetchAlways: true }
            ),
            this.tmdbService.getTmdbEpisode$(
              ids.tmdb,
              parseInt(this.params['season'] ?? ''),
              parseInt(this.params['episode'] ?? ''),
              { fetchAlways: true }
            ),
            of(episodes),
          ]);
        }),
        map(([episodeProgress, show, episode, tmdbEpisode, episodes]) => {
          if (!show) throw Error('Show is empty');

          this.pageState.next(LoadingState.SUCCESS);
          this.episodeInfo = {
            episodeProgress,
            show,
            episode,
            tmdbEpisode,
            episodes,
          };
          console.debug('episodeInfo', this.episodeInfo);

          this.title.setTitle(
            `${this.episodeService.getEpisodeTitle(this.episodeInfo)}
            - ${show.title}
            - ${this.seasonService.getSeasonTitle(`Season ${this.params?.['season']}`)}
            - Trakify`
          );

          this.showService.activeShow.next(show);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({ error: (error) => onError(error, this.snackBar, this.pageState) });

    this.tmdbService.tmdbConfig.$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (tmdbConfig) => {
        if (!tmdbConfig) return;
        this.stillPrefix = tmdbConfig.images.secure_base_url + tmdbConfig.images.still_sizes[3];
      },
      error: (error) => onError(error, this.snackBar, this.pageState),
    });
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.showService.activeShow.next(undefined);
  }
}

import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BehaviorSubject, combineLatest, map, of, switchMap, takeUntil } from 'rxjs';

import { TmdbService } from '@services/tmdb.service';
import { BaseComponent } from '@helper/base-component';
import { InfoService } from '@services/info.service';
import { onError } from '@helper/error';
import { ShowService } from '@services/trakt/show.service';
import { EpisodeService } from '@services/trakt/episode.service';
import { ExecuteService } from '@services/execute.service';
import { SeasonService } from '@services/trakt/season.service';

import { LoadingState } from '@type/enum';

import type { EpisodeInfo } from '@type/interfaces/Show';
import { BreadcrumbPart } from '@type/interfaces/Breadcrumb';
import { episodeTitle } from '../../../pipes/episode-title.pipe';
import { seasonTitle } from '../../../pipes/season-title.pipe';

@Component({
  selector: 't-episode-page',
  templateUrl: './episode.component.html',
  styleUrls: ['./episode.component.scss'],
})
export class EpisodeComponent extends BaseComponent implements OnInit, OnDestroy {
  pageState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  episodeState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
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
          this.pageState.next(LoadingState.LOADING);
          this.episodeState.next(LoadingState.LOADING);
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

          this.pageState.next(LoadingState.SUCCESS);

          this.breadcrumbParts = [
            {
              name: show.title,
              link: `/series/s/${this.params['slug']}`,
            },
            {
              name: seasonTitle(`Season ${this.params['season']}`),
              link: `/series/s/${this.params['slug']}/season/${this.params['season']}`,
            },
            {
              name: `Episode ${this.params['episode']}`,
              link: `/series/s/${this.params['slug']}/season/
                  ${this.params['season']}/episode/${this.params['episode']}`,
            },
          ];

          this.episodeInfo = {
            episodes,
          };

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
          ]);
        }),
        map(([episodeProgress, show, episode, tmdbEpisode]) => {
          if (!show) throw Error('Show is empty');

          this.episodeState.next(LoadingState.SUCCESS);
          this.episodeInfo = {
            ...this.episodeInfo,
            episodeProgress,
            show,
            episode,
            tmdbEpisode,
          };
          console.debug('episodeInfo', this.episodeInfo);

          this.title.setTitle(
            `${episodeTitle(this.episodeInfo)}
            - ${show.title}
            - ${seasonTitle(`Season ${this.params?.['season']}`)}
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
        this.stillPrefix = tmdbConfig.images.secure_base_url + tmdbConfig.images.still_sizes[2];
      },
      error: (error) => onError(error, this.snackBar, this.pageState),
    });
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.showService.activeShow.next(undefined);
  }
}

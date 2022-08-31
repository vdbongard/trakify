import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { TmdbService } from '../../../../shared/services/tmdb.service';
import { BaseComponent } from '../../../../shared/helper/base-component';
import { BehaviorSubject, combineLatest, map, switchMap, takeUntil } from 'rxjs';
import { EpisodeInfo } from '../../../../../types/interfaces/Show';
import { BreadcrumbPart } from '../../../../shared/components/breadcrumb/breadcrumb.component';
import { InfoService } from '../../../../shared/services/info.service';
import { LoadingState } from '../../../../../types/enum';
import { onError } from '../../../../shared/helper/error';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ShowService } from '../../../../shared/services/trakt/show.service';
import { EpisodeService } from '../../../../shared/services/trakt/episode.service';
import { ExecuteService } from '../../../../shared/services/execute.service';
import { SeasonService } from '../../../../shared/services/trakt/season.service';
import { Title } from '@angular/platform-browser';

@Component({
  selector: 't-episode-page',
  templateUrl: './episode.component.html',
  styleUrls: ['./episode.component.scss'],
})
export class EpisodeComponent extends BaseComponent implements OnInit, OnDestroy {
  loadingState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  seenLoading = new BehaviorSubject<LoadingState>(LoadingState.SUCCESS);
  loadingStateEnum = LoadingState;
  episodeInfo?: EpisodeInfo;
  breadcrumbParts?: BreadcrumbPart[];
  stillPrefix?: string;
  params?: ParamMap;

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
    this.route.paramMap
      .pipe(
        switchMap((params) => {
          if (!params.has('slug') || !params.has('season') || !params.has('episode'))
            throw Error('Param is empty');
          this.params = params;
          this.episodeInfo = undefined;
          return this.showService.getIdsBySlug$(params.get('slug'), { fetch: true });
        }),
        switchMap((ids) => {
          if (!ids) throw Error('Ids is empty');
          return combineLatest([
            this.episodeService.getEpisodeProgress$(
              ids,
              parseInt(this.params?.get('season') ?? ''),
              parseInt(this.params?.get('episode') ?? '')
            ),
            this.showService.getShow$(ids, { fetch: true }),
            this.episodeService.getEpisode$(
              ids,
              parseInt(this.params?.get('season') ?? ''),
              parseInt(this.params?.get('episode') ?? ''),
              { fetchAlways: true }
            ),
            this.tmdbService.getTmdbEpisode$(
              ids.tmdb,
              parseInt(this.params?.get('season') ?? ''),
              parseInt(this.params?.get('episode') ?? ''),
              { fetchAlways: true }
            ),
            this.seasonService.getSeasonEpisodes$(
              ids,
              parseInt(this.params?.get('season') ?? ''),
              false,
              false
            ),
          ]);
        }),
        map(([episodeProgress, show, episode, tmdbEpisode, episodes]) => {
          if (!show) throw Error('Show is empty');

          this.loadingState.next(LoadingState.SUCCESS);
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
            - ${this.seasonService.getSeasonTitle(`Season ${this.params?.get('season')}`)}
            - Trakify`
          );

          this.showService.activeShow.next(show);

          if (this.params) {
            this.breadcrumbParts = [
              {
                name: show.title,
                link: `/series/s/${this.params.get('slug')}`,
              },
              {
                name: this.seasonService.getSeasonTitle(`Season ${this.params.get('season')}`),
                link: `/series/s/${this.params.get('slug')}/season/${this.params.get('season')}`,
              },
              {
                name: `Episode ${this.params.get('episode')}`,
                link: `/series/s/${this.params.get('slug')}/season/
                  ${this.params.get('season')}/episode/${this.params.get('episode')}`,
              },
            ];
          }
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({ error: (error) => onError(error, this.snackBar, this.loadingState) });

    this.tmdbService.tmdbConfig.$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (tmdbConfig) => {
        if (!tmdbConfig) return;
        this.stillPrefix = tmdbConfig.images.secure_base_url + tmdbConfig.images.still_sizes[3];
      },
      error: (error) => onError(error, this.snackBar, this.loadingState),
    });
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.showService.activeShow.next(undefined);
  }
}

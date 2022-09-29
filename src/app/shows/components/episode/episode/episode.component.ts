import { Component, OnDestroy, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
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
import * as Paths from 'src/app/paths';
import { z } from 'zod';

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
  params?: z.infer<typeof paramSchema>;

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
        map((params) => paramSchema.parse(params)),
        switchMap((params) => {
          this.pageState.next(LoadingState.LOADING);
          this.episodeState.next(LoadingState.LOADING);
          this.params = params;
          this.episodeInfo = undefined;
          return this.showService.getShowBySlug$(params.show, { fetchAlways: true });
        }),
        switchMap((show) => {
          if (!show) throw Error('Show is empty (EpisodeComponent)');
          if (!this.params) throw Error('Params is empty (EpisodeComponent)');
          return combineLatest([
            of(show),
            this.seasonService.getSeasonEpisodes$(show, parseInt(this.params.season), false, false),
          ]);
        }),
        switchMap(([show, episodes]) => {
          if (!this.params) throw Error('Params is empty (EpisodeComponent 2)');

          this.pageState.next(LoadingState.SUCCESS);

          this.breadcrumbParts = [
            {
              name: show.title,
              link: Paths.show({ show: this.params.show }),
            },
            {
              name: seasonTitle(`Season ${this.params.season}`),
              link: Paths.season({ show: this.params.show, season: this.params.season }),
            },
            {
              name: `Episode ${this.params.episode}`,
              link: Paths.episode({
                show: this.params.show,
                season: this.params.season,
                episode: this.params.episode,
              }),
            },
          ];

          this.episodeInfo = {
            episodes,
          };

          return combineLatest([
            this.episodeService.getEpisodeProgress$(
              show,
              parseInt(this.params.season),
              parseInt(this.params.episode)
            ),
            of(show),
            this.episodeService.getEpisode$(
              show,
              parseInt(this.params.season),
              parseInt(this.params.episode),
              { fetchAlways: true }
            ),
            this.tmdbService.getTmdbEpisode$(
              show,
              parseInt(this.params.season),
              parseInt(this.params.episode),
              { fetchAlways: true }
            ),
          ]);
        }),
        map(([episodeProgress, show, episode, tmdbEpisode]) => {
          if (!this.params) throw Error('Params is empty (EpisodeComponent 3)');

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
            `${episodeTitle(
              this.episodeInfo.episode,
              this.episodeInfo.tmdbEpisode,
              this.episodeInfo.episodeProgress
            )}
            - ${show.title}
            - ${seasonTitle(`Season ${this.params.season}`)}
            - Trakify`
          );

          this.showService.activeShow.next(show);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({ error: (error) => onError(error, this.snackBar, this.pageState) });
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy();
    this.showService.activeShow.next(undefined);
  }
}

const paramSchema = z.object({
  show: z.string(),
  season: z.string(),
  episode: z.string(),
});

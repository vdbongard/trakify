import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, of, switchMap, takeUntil } from 'rxjs';
import { TmdbService } from '../../../../services/tmdb.service';
import { ShowService } from '../../../../services/show.service';
import { TmdbConfiguration } from '../../../../../types/interfaces/Tmdb';
import { SyncService } from '../../../../services/sync.service';
import { ShowInfo } from '../../../../../types/interfaces/Show';
import { BaseComponent } from '../../../../helper/base-component';
import { EpisodeFull, TraktShow } from '../../../../../types/interfaces/Trakt';

@Component({
  selector: 'app-show',
  templateUrl: './show.component.html',
  styleUrls: ['./show.component.scss'],
})
export class ShowComponent extends BaseComponent implements OnInit {
  show: ShowInfo = {};
  tmdbConfig?: TmdbConfiguration;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private showService: ShowService,
    public syncService: SyncService,
    private tmdbService: TmdbService
  ) {
    super();
  }

  ngOnInit(): void {
    this.route.params
      .pipe(
        switchMap((params) => {
          const slug = params['slug'];
          this.getShow(slug);

          const ids = this.showService.getIdForSlug(slug);
          if (!ids) return of([]);

          this.getTmdbShow(ids.tmdb);

          return combineLatest([this.showService.getShowProgressAll$(ids.trakt), of(ids)]);
        }),
        switchMap(([showProgress, ids]) => {
          this.show.showProgress = showProgress;

          if (!showProgress || !showProgress.next_episode || !ids) {
            this.show.tmdbNextEpisode = undefined;
            return of(undefined);
          }

          const season = showProgress.next_episode.season;
          const episode = showProgress.next_episode.number;

          this.getTmdbEpisode(ids.tmdb, season, episode);
          return this.showService.getShowEpisodeAll$(ids.trakt, season, episode);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((nextEpisode) => {
        this.show.nextEpisode = nextEpisode;
      });

    this.tmdbService.tmdbConfig$
      .pipe(takeUntil(this.destroy$))
      .subscribe((config) => (this.tmdbConfig = config));
  }

  getShow(slug?: string): void {
    if (!slug) return;

    this.showService.fetchShow(slug).subscribe((show) => {
      this.show.show = show;
    });
  }

  getTmdbShow(tmdbId?: number): void {
    if (!tmdbId) return;
    this.tmdbService.fetchShow(tmdbId).subscribe((tmdbShow) => {
      this.show.tmdbShow = tmdbShow;
    });
  }

  getTmdbEpisode(tmdbId?: number, season?: number, episode?: number): void {
    if (!tmdbId || !season || !episode) return;
    this.tmdbService
      .fetchEpisode(tmdbId, season, episode)
      .subscribe((episode) => (this.show.tmdbNextEpisode = episode));
  }

  addToHistory(nextEpisode: EpisodeFull, show: TraktShow): void {
    if (!nextEpisode || !show) return;

    this.showService
      .getNextEpisode$(show, nextEpisode.season, nextEpisode.number)
      .pipe(takeUntil(this.destroy$))
      .subscribe((nextEpisode) => {
        this.show.nextEpisode = nextEpisode;
      });

    this.syncService.syncAddToHistory(nextEpisode, show.ids);
  }
}

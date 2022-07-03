import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { filter, takeUntil } from 'rxjs';
import { TmdbService } from '../../../../services/tmdb.service';
import { ShowService } from '../../../../services/show.service';
import { TmdbConfiguration } from '../../../../../types/interfaces/Tmdb';
import { Ids } from '../../../../../types/interfaces/Trakt';
import { SyncService } from '../../../../services/sync.service';
import { ShowInfo } from '../../../../../types/interfaces/Show';
import { BaseComponent } from '../../../../helper/base-component';

@Component({
  selector: 'app-show',
  templateUrl: './show.component.html',
  styleUrls: ['./show.component.scss'],
})
export class ShowComponent extends BaseComponent implements OnInit {
  show: ShowInfo = {};

  tmdbConfig?: TmdbConfiguration;
  ids?: Ids;

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
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const slug = params['slug'];
      this.ids = this.showService.getIdForSlug(slug);
      this.getShow(slug);
    });

    this.tmdbService.tmdbConfig$
      .pipe(takeUntil(this.destroy$))
      .subscribe((config) => (this.tmdbConfig = config));

    this.showService
      .getShowProgressAll$(this.ids!.trakt)
      .pipe(
        filter(() => !!this.ids?.trakt),
        takeUntil(this.destroy$)
      )
      .subscribe((showProgress) => {
        this.show.showProgress = showProgress;

        if (!showProgress || !showProgress.next_episode) {
          this.show.nextEpisode = undefined;
          this.show.tmdbNextEpisode = undefined;
          return;
        }

        this.showService
          .getShowEpisodeAll$(
            this.ids!.trakt,
            showProgress.next_episode.season,
            showProgress.next_episode.number
          )
          .pipe(filter(() => !!this.ids?.trakt))
          .subscribe((showEpisode) => {
            this.show.nextEpisode = showEpisode;

            this.getTmdbEpisode(
              this.ids!.tmdb,
              showProgress.next_episode.season,
              showProgress.next_episode.number
            );
          });
      });
  }

  getShow(slug?: string): void {
    if (!slug) return;

    this.showService.fetchShow(slug).subscribe((show) => {
      this.show.show = show;
      this.getTmdbShow(show?.ids.tmdb);
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
}

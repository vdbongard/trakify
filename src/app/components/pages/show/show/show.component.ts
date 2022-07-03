import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { TmdbService } from '../../../../services/tmdb.service';
import { ShowService } from '../../../../services/show.service';
import { TmdbConfiguration, TmdbEpisode, TmdbShow } from '../../../../../types/interfaces/Tmdb';
import { EpisodeFull, Ids, ShowProgress } from '../../../../../types/interfaces/Trakt';
import { SyncService } from '../../../../services/sync.service';

@Component({
  selector: 'app-show',
  templateUrl: './show.component.html',
  styleUrls: ['./show.component.scss'],
})
export class ShowComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  showProgress?: ShowProgress;
  tmdbShow?: TmdbShow;
  nextEpisode?: EpisodeFull;
  tmdbNextEpisode?: TmdbEpisode;
  tmdbConfig?: TmdbConfiguration;
  ids?: Ids;

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private showService: ShowService,
    public syncService: SyncService,
    private tmdbService: TmdbService
  ) {}

  ngOnInit(): void {
    this.subscriptions = [
      this.route.params.subscribe((params) => {
        const slug = params['slug'];
        this.ids = this.showService.getIdForSlug(slug);
        this.getShow(slug);
      }),
      this.tmdbService.tmdbConfig$.subscribe((config) => (this.tmdbConfig = config)),
      this.showService
        .getShowProgressAll$(this.ids!.trakt)
        .pipe(filter(() => !!this.ids?.trakt))
        .subscribe((showProgress) => {
          this.showProgress = showProgress;

          if (!showProgress || !showProgress.next_episode) {
            this.nextEpisode = undefined;
            this.tmdbNextEpisode = undefined;
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
              this.nextEpisode = showEpisode;

              this.getTmdbEpisode(
                this.ids!.tmdb,
                showProgress.next_episode.season,
                showProgress.next_episode.number
              );
            });
        }),
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  getShow(slug?: string): void {
    if (!slug) return;

    this.showService.fetchShow(slug).subscribe((show) => {
      this.getTmdbShow(show?.ids.tmdb);
    });
  }

  getTmdbShow(tmdbId?: number): void {
    if (!tmdbId) return;
    this.tmdbService.fetchShow(tmdbId).subscribe((tmdbShow) => {
      this.tmdbShow = tmdbShow;
    });
  }

  getTmdbEpisode(tmdbId?: number, season?: number, episode?: number): void {
    if (!tmdbId || !season || !episode) return;
    this.tmdbService
      .fetchEpisode(tmdbId, season, episode)
      .subscribe((episode) => (this.tmdbNextEpisode = episode));
  }
}

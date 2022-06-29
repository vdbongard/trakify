import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatestWith, filter, Subscription } from 'rxjs';
import { TmdbService } from '../../../../services/tmdb.service';
import { ShowService } from '../../../../services/show.service';
import { TmdbConfiguration, TmdbEpisode, TmdbShow } from '../../../../../types/interfaces/Tmdb';
import { EpisodeFull, Ids, ShowProgress } from '../../../../../types/interfaces/Trakt';
import { SyncService } from '../../../../services/sync.service';
import { episodeId } from '../../../../helper/episodeId';

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
  slug?: string;
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
        this.slug = params['slug'];
        if (!this.slug) return;

        this.ids = this.showService.getIdForSlug(this.slug);

        if (!this.ids) {
          this.showService.fetchShow(this.slug).subscribe((show) => {
            if (!show) return;
            const tmdbId = show.ids.tmdb;
            this.tmdbService.fetchShow(tmdbId).subscribe((tmdbShow) => {
              this.tmdbShow = tmdbShow;
            });
          });
          return;
        }
      }),
      this.tmdbService.tmdbConfig.subscribe((config) => (this.tmdbConfig = config)),
      this.tmdbService
        .fetchShow(this.ids?.tmdb)
        .pipe(
          filter(() => !!this.ids),
          combineLatestWith(
            this.showService.showsProgress,
            this.showService.addedShowInfos,
            this.showService.showsEpisodes
          )
        )
        .subscribe(([tmdbShow, showsProgress, addedShowInfos, showsEpisodes]) => {
          this.showProgress =
            showsProgress[this.ids!.trakt] || addedShowInfos[this.ids!.trakt]?.showProgress;
          if (!this.showProgress || !this.showProgress.next_episode) {
            this.nextEpisode = undefined;
            this.tmdbNextEpisode = undefined;
            return;
          }

          this.tmdbShow = tmdbShow;

          this.tmdbService
            .fetchEpisode(
              this.ids!.tmdb,
              this.showProgress.next_episode.season,
              this.showProgress.next_episode.number
            )
            .subscribe((episode) => (this.tmdbNextEpisode = episode));

          this.nextEpisode =
            showsEpisodes[
              episodeId(
                this.ids!.trakt,
                this.showProgress.next_episode.season,
                this.showProgress.next_episode.number
              )
            ] || addedShowInfos[this.ids!.trakt].nextEpisode;
        }),
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}

import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, Subscription } from 'rxjs';
import { TmdbService } from '../../../../services/tmdb.service';
import { ShowService } from '../../../../services/show.service';
import { TmdbConfiguration, TmdbEpisode, TmdbShow } from '../../../../../types/interfaces/Tmdb';
import { EpisodeFull, ShowProgress, ShowWatched } from '../../../../../types/interfaces/Trakt';
import { SyncService } from '../../../../services/sync.service';
import { episodeId } from '../../../../helper/episodeId';

@Component({
  selector: 'app-show',
  templateUrl: './show.component.html',
  styleUrls: ['./show.component.scss'],
})
export class ShowComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  watched?: ShowWatched;
  showProgress?: ShowProgress;
  tmdbShow?: TmdbShow;
  nextEpisode?: EpisodeFull;
  tmdbNextEpisode?: TmdbEpisode;
  tmdbConfig?: TmdbConfiguration;
  slug?: string;

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

        const ids = this.showService.getIdForSlug(this.slug);
        if (!ids) {
          this.showService.fetchShow(this.slug).subscribe((show) => {
            if (!show) return;
            const tmdbId = show.ids.tmdb;
            this.tmdbService.fetchShow(tmdbId).subscribe((tmdbShow) => {
              this.tmdbShow = tmdbShow;
            });
          });
          return;
        }

        this.watched = this.showService.getShowWatched(ids.trakt);
        this.tmdbShow = this.tmdbService.getShow(ids.tmdb);
      }),
      this.tmdbService.tmdbConfig.subscribe((config) => (this.tmdbConfig = config)),
      this.showService.showsProgress.subscribe((showsProgress) => {
        if (!this.watched) return;

        const showProgress = showsProgress[this.watched.show.ids.trakt];
        this.showProgress = showProgress;
        if (!showProgress || !showProgress.next_episode) return;

        this.tmdbService
          .fetchEpisode(
            this.watched.show.ids.tmdb,
            showProgress.next_episode.season,
            showProgress.next_episode.number
          )
          .subscribe((episode) => (this.tmdbNextEpisode = episode));
      }),
      combineLatest([this.showService.showsEpisodes, this.showService.showsProgress]).subscribe(
        ([episodes, showsProgress]) => {
          if (!this.watched || !showsProgress) return;
          const showProgress = showsProgress[this.watched.show.ids.trakt];
          if (!showProgress.next_episode) {
            this.nextEpisode = undefined;
            return;
          }
          this.nextEpisode =
            episodes[
              episodeId(
                this.watched.show.ids.trakt,
                showProgress.next_episode.season,
                showProgress.next_episode.number
              )
            ];
        }
      ),
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}

import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { TmdbService } from '../../../../services/tmdb.service';
import { ShowService } from '../../../../services/show.service';
import { Episode, Show, TmdbConfiguration } from '../../../../../types/interfaces/Tmdb';
import { EpisodeFull, ShowProgress, ShowWatched } from '../../../../../types/interfaces/Trakt';
import { SyncService } from '../../../../services/sync.service';

@Component({
  selector: 'app-show',
  templateUrl: './show.component.html',
  styleUrls: ['./show.component.scss'],
})
export class ShowComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  watched?: ShowWatched;
  showProgress?: ShowProgress;
  show?: Show;
  nextEpisode?: EpisodeFull;
  tmdbNextEpisode?: Episode;
  tmdbConfig?: TmdbConfiguration;

  constructor(
    private route: ActivatedRoute,
    private showService: ShowService,
    public syncService: SyncService,
    private tmdbService: TmdbService
  ) {}

  ngOnInit(): void {
    this.subscriptions = [
      this.route.params.subscribe((params) => {
        const slug = params['slug'];
        if (!slug) return;

        const ids = this.showService.getIdForSlug(slug);
        if (!ids) return;

        this.watched = this.showService.getShowWatchedLocally(ids.trakt);
        this.show = this.tmdbService.getShowLocally(ids.tmdb);
      }),
      this.tmdbService.tmdbConfig.subscribe((config) => (this.tmdbConfig = config)),
      this.showService.showsProgress.subscribe((showsProgress) => {
        if (!this.watched) return;

        const showProgress = showsProgress[this.watched.show.ids.trakt];
        this.showProgress = showProgress;
        if (!showProgress || !showProgress.next_episode) return;

        this.tmdbService
          .getEpisode(
            this.watched.show.ids.tmdb,
            showProgress.next_episode.season,
            showProgress.next_episode.number
          )
          .subscribe((episode) => (this.tmdbNextEpisode = episode));
      }),
      this.showService.showsEpisodes.subscribe((episodes) => {
        if (!this.watched || !this.showProgress) return;
        this.nextEpisode =
          episodes[
            `${this.watched.show.ids.trakt}-${this.showProgress.next_episode.season}-${this.showProgress.next_episode.number}`
          ];
      }),
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}

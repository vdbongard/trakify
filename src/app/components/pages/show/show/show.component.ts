import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { TmdbService } from '../../../../services/tmdb.service';
import { ShowService } from '../../../../services/show.service';
import { TmdbConfiguration, Episode, Show } from '../../../../../types/interfaces/Tmdb';
import {
  ShowProgress,
  ShowWatched,
  Episode as TraktEpisode,
} from '../../../../../types/interfaces/Trakt';
import { SyncService } from '../../../../services/sync.service';

@Component({
  selector: 'app-show',
  templateUrl: './show.component.html',
  styleUrls: ['./show.component.scss'],
})
export class ShowComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  watched?: ShowWatched;
  progress?: ShowProgress;
  show?: Show;
  nextEpisode?: Episode;
  tmdbConfig?: TmdbConfiguration;

  constructor(
    private route: ActivatedRoute,
    private showService: ShowService,
    private syncService: SyncService,
    private tmdbService: TmdbService
  ) {}

  ngOnInit(): void {
    this.subscriptions = [
      this.route.params.subscribe((params) => {
        const slug = params['slug'];

        const ids = this.showService.getIdForSlug(slug);
        if (!ids) return;

        this.watched = this.showService.getShowWatchedLocally(ids.trakt);
        this.show = this.tmdbService.getShowLocally(ids.tmdb);
      }),
      this.tmdbService.tmdbConfig.subscribe((config) => (this.tmdbConfig = config)),
      this.showService.showsProgress.subscribe((showsProgress) => {
        if (!this.watched) return;
        const showProgress = showsProgress[this.watched.show.ids.trakt];
        this.progress = showProgress;
        if (!showProgress || !showProgress.next_episode) return;
        this.tmdbService
          .getEpisode(
            this.watched.show.ids.tmdb,
            showProgress.next_episode.season,
            showProgress.next_episode.number
          )
          .subscribe((episode) => (this.nextEpisode = episode));
      }),
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }

  addToHistory(episode: TraktEpisode, watched: ShowWatched): void {
    this.nextEpisode = undefined;
    this.showService.addToHistory(episode).subscribe(async (res) => {
      if (res.not_found.episodes.length > 0) {
        console.error('res', res);
        return;
      }

      this.syncService.syncShowProgress(watched.show.ids.trakt, true);

      this.syncService.getLastActivity().subscribe((lastActivity) => {
        this.syncService.sync(lastActivity);
      });
    });
  }
}

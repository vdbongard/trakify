import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ShowService } from '../../../../services/show.service';
import {
  EpisodeFull,
  EpisodeProgress,
  Ids,
  ShowWatched,
} from '../../../../../types/interfaces/Trakt';
import { SyncService } from '../../../../services/sync.service';
import { Episode, TmdbConfiguration } from '../../../../../types/interfaces/Tmdb';
import { TmdbService } from '../../../../services/tmdb.service';

@Component({
  selector: 'app-episode-page',
  templateUrl: './episode.component.html',
  styleUrls: ['./episode.component.scss'],
})
export class EpisodeComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  watched?: ShowWatched;
  episodeProgress?: EpisodeProgress;
  episode?: EpisodeFull;
  tmdbEpisode?: Episode;
  tmdbConfig?: TmdbConfiguration;
  slug?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  ids?: Ids;

  constructor(
    private route: ActivatedRoute,
    public showService: ShowService,
    public syncService: SyncService,
    private tmdbService: TmdbService
  ) {}

  ngOnInit(): void {
    this.subscriptions = [
      this.route.params.subscribe(async (params) => {
        this.slug = params['slug'];
        this.seasonNumber = parseInt(params['season']);
        this.episodeNumber = parseInt(params['episode']);
        if (!this.slug || !this.seasonNumber || !this.episodeNumber) return;

        this.ids = this.showService.getIdForSlug(this.slug);
        if (!this.ids) return;

        this.watched = this.showService.getShowWatchedLocally(this.ids.trakt);
        if (!this.watched) return;

        this.episodeProgress = this.showService.getEpisodeProgressLocally(
          this.ids.trakt,
          this.seasonNumber,
          this.episodeNumber
        );

        this.episode = undefined;
        await this.syncService.syncShowsEpisodes(
          this.ids.trakt,
          this.seasonNumber,
          this.episodeNumber
        );
        this.episode = this.showService.getEpisodeLocally(
          this.ids.trakt,
          this.seasonNumber,
          this.episodeNumber
        );

        this.tmdbService
          .getEpisode(this.watched.show.ids.tmdb, this.seasonNumber, this.episodeNumber)
          .subscribe((episode) => (this.tmdbEpisode = episode));
      }),
      this.showService.showsProgress.subscribe(() => {
        if (!this.ids || !this.seasonNumber || !this.episodeNumber) return;

        this.episodeProgress = this.showService.getEpisodeProgressLocally(
          this.ids.trakt,
          this.seasonNumber,
          this.episodeNumber
        );
      }),
      this.tmdbService.tmdbConfig.subscribe((config) => (this.tmdbConfig = config)),
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}

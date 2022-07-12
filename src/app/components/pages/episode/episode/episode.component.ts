import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ShowService } from '../../../../services/show.service';
import {
  EpisodeFull,
  EpisodeProgress,
  Ids,
  ShowWatched,
  TraktShow,
  Translation,
} from '../../../../../types/interfaces/Trakt';
import { SyncService } from '../../../../services/sync.service';
import { TmdbConfiguration, TmdbEpisode } from '../../../../../types/interfaces/Tmdb';
import { TmdbService } from '../../../../services/tmdb.service';
import { episodeId } from '../../../../helper/episodeId';
import { BaseComponent } from '../../../../helper/base-component';
import { combineLatest, takeUntil } from 'rxjs';

@Component({
  selector: 'app-episode-page',
  templateUrl: './episode.component.html',
  styleUrls: ['./episode.component.scss'],
})
export class EpisodeComponent extends BaseComponent implements OnInit, OnDestroy {
  show?: TraktShow;
  watched?: ShowWatched;
  episodeProgress?: EpisodeProgress;
  episode?: EpisodeFull;
  episodeTranslation?: Translation;
  tmdbEpisode?: TmdbEpisode;
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
  ) {
    super();
  }

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(async (params) => {
      this.slug = params['slug'];
      this.seasonNumber = parseInt(params['season']);
      this.episodeNumber = parseInt(params['episode']);
      if (!this.slug || !this.seasonNumber || !this.episodeNumber) return;

      this.ids = this.showService.getIdsBySlug(this.slug);
      if (!this.ids) return;

      this.show = this.showService.getShow(this.ids.trakt);
      if (!this.show) return;

      this.watched = this.showService.getShowWatched(this.ids.trakt);

      this.episodeProgress = this.showService.getEpisodeProgress(
        this.ids.trakt,
        this.seasonNumber,
        this.episodeNumber
      );

      this.episode = undefined;
      await this.showService.syncShowEpisode(this.ids.trakt, this.seasonNumber, this.episodeNumber);

      this.tmdbService
        .fetchTmdbEpisode(this.show.ids.tmdb, this.seasonNumber, this.episodeNumber)
        .subscribe((episode) => (this.tmdbEpisode = episode));
    });

    this.showService.showsProgress$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      if (!this.ids || !this.seasonNumber || !this.episodeNumber) return;

      this.episodeProgress = this.showService.getEpisodeProgress(
        this.ids.trakt,
        this.seasonNumber,
        this.episodeNumber
      );
    });

    combineLatest([this.showService.showsEpisodes$, this.showService.showsEpisodesTranslations$])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([showsEpisodes, translations]) => {
        this.episode =
          showsEpisodes[episodeId(this.ids?.trakt, this.seasonNumber, this.episodeNumber)];
        this.episodeTranslation =
          translations[episodeId(this.ids?.trakt, this.seasonNumber, this.episodeNumber)];
      });

    this.tmdbService.tmdbConfig$
      .pipe(takeUntil(this.destroy$))
      .subscribe((config) => (this.tmdbConfig = config));
  }
}

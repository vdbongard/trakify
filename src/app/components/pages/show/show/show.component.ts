import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, of, switchMap, takeUntil } from 'rxjs';
import { TmdbService } from '../../../../services/tmdb.service';
import { ShowService } from '../../../../services/show.service';
import { TmdbConfiguration } from '../../../../../types/interfaces/Tmdb';
import { SyncService } from '../../../../services/sync.service';
import { ShowInfo } from '../../../../../types/interfaces/Show';
import { BaseComponent } from '../../../../helper/base-component';
import { EpisodeFull, Ids, TraktShow } from '../../../../../types/interfaces/Trakt';
import { ConfigService } from '../../../../services/config.service';

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
    private tmdbService: TmdbService,
    private configService: ConfigService
  ) {
    super();
  }

  ngOnInit(): void {
    this.route.params
      .pipe(
        switchMap((params) => {
          const slug = params['slug'];
          const ids = this.showService.getIdForSlug(slug);

          this.getShow(slug, ids);

          if (!ids) return of([]);

          this.show.showWatched = this.showService.getShowWatched(ids.trakt);

          return combineLatest([
            this.showService.getShowProgressAll$(ids.trakt),
            this.showService.showsTranslations$,
            of(ids),
          ]);
        }),
        switchMap(([showProgress, showsTranslations, ids]) => {
          this.show.showProgress = showProgress;
          this.show.showTranslation = showsTranslations[ids.trakt];

          if (!ids) return of([]);

          const nextEpisode = showProgress?.next_episode;
          const seasonNumber = nextEpisode?.season || 1;
          const episodeNumber = nextEpisode?.number || 1;

          this.getTmdbEpisode(ids.tmdb, seasonNumber, episodeNumber);
          return combineLatest([
            this.showService.getShowEpisodeAll$(ids.trakt, seasonNumber, episodeNumber),
            this.showService.getShowEpisodeAllTranslation$(ids.trakt, seasonNumber, episodeNumber),
          ]);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(([nextEpisode, nextEpisodeTranslation]) => {
        this.show.nextEpisode = nextEpisode;
        this.show.nextEpisodeTranslation = nextEpisodeTranslation;
      });

    this.tmdbService.tmdbConfig$
      .pipe(takeUntil(this.destroy$))
      .subscribe((config) => (this.tmdbConfig = config));
  }

  getShow(slug?: string, ids?: Ids): void {
    if (!slug) return;
    if (this.show.show?.ids.slug === slug) return;

    const tmdbId = ids?.tmdb;
    this.getTmdbShow(tmdbId);

    this.showService.fetchShow(slug).subscribe((show) => {
      this.show.show = show;
      if (!tmdbId) {
        this.getTmdbShow(show.ids.tmdb);
      }
    });
    const language = this.configService.config$.value.language.substring(0, 2);
    if (language !== 'en') {
      this.showService.fetchShowTranslation(slug, language).subscribe((showTranslation) => {
        this.show.showTranslation = showTranslation;
      });
    }
  }

  getTmdbShow(tmdbId?: number): void {
    if (!tmdbId) return;
    if (this.show.tmdbShow?.id === tmdbId) return;

    this.tmdbService.fetchTmdbShow(tmdbId).subscribe((tmdbShow) => {
      this.show.tmdbShow = tmdbShow;
    });
  }

  getTmdbEpisode(tmdbId?: number, seasonNumber?: number, episodeNumber?: number): void {
    if (!tmdbId || !seasonNumber || !episodeNumber) return;
    const episode = this.show.tmdbNextEpisode;
    const showTmdbId = this.show.show?.ids.tmdb || this.show.tmdbShow?.id;
    if (
      episode &&
      showTmdbId === tmdbId &&
      episode.season_number === seasonNumber &&
      episode.episode_number === episodeNumber
    )
      return;

    this.tmdbService
      .fetchEpisode(tmdbId, seasonNumber, episodeNumber)
      .subscribe((episode) => (this.show.tmdbNextEpisode = episode));
  }

  addToHistory(nextEpisode: EpisodeFull, show: TraktShow): void {
    if (!nextEpisode || !show) return;

    this.showService
      .getNextEpisode$(show, nextEpisode.season, nextEpisode.number)
      .pipe(takeUntil(this.destroy$))
      .subscribe((episodes) => {
        if (!episodes) return;
        const [episode, tmdbEpisode] = episodes;
        this.show.nextEpisode = episode;
        this.show.tmdbNextEpisode = tmdbEpisode;

        this.showService.setShowEpisode(show.ids.trakt, episode, false);

        this.syncService.syncAddToHistory(nextEpisode, show.ids);
      });
  }
}

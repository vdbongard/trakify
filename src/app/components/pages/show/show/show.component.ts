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

          const seasonNumber = showProgress.next_episode.season;
          const episodeNumber = showProgress.next_episode.number;

          this.getTmdbEpisode(ids.tmdb, seasonNumber, episodeNumber);
          return this.showService.getShowEpisodeAll$(ids.trakt, seasonNumber, episodeNumber);
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
    if (this.show.show?.ids.slug === slug) return;

    this.showService.fetchShow(slug).subscribe((show) => {
      this.show.show = show;
    });
  }

  getTmdbShow(tmdbId?: number): void {
    if (!tmdbId) return;
    if (this.show.tmdbShow?.id === tmdbId) return;

    this.tmdbService.fetchShow(tmdbId).subscribe((tmdbShow) => {
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
        this.syncService.syncAddToHistory(nextEpisode, show.ids);
      });
  }
}

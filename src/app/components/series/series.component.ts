import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of, Subscription, switchMap } from 'rxjs';
import { TmdbService } from '../../services/tmdb.service';
import { SeriesService } from '../../services/series.service';
import { Configuration, Series } from '../../../types/interfaces/Tmdb';
import { SeriesWatched } from '../../../types/interfaces/Trakt';

@Component({
  selector: 'app-series',
  templateUrl: './series.component.html',
  styleUrls: ['./series.component.scss'],
})
export class SeriesComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  series: Series | undefined;
  tmdbSeries: { [key: number]: Series } | undefined;
  config: Configuration | undefined;
  seriesWatched: SeriesWatched | undefined;

  constructor(
    private route: ActivatedRoute,
    private seriesService: SeriesService,
    private tmdbService: TmdbService
  ) {}

  ngOnInit(): void {
    this.subscriptions = [
      this.route.params
        .pipe(
          switchMap((params) => {
            const slug = params['slug'];
            this.seriesWatched = this.seriesService.getSeriesWatchedLocally(slug);
            const id = this.seriesWatched?.show.ids.tmdb;
            if (id === undefined) return of(undefined);
            return of(this.tmdbService.getSeriesLocally(id));
          })
        )
        .subscribe((series) => (this.series = series)),
      this.tmdbService.series.subscribe((series) => (this.tmdbSeries = series)),
      this.tmdbService.config.subscribe((config) => (this.config = config)),
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}

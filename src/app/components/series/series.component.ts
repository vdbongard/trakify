import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of, Subscription, switchMap } from 'rxjs';
import { TmdbService } from '../../services/tmdb.service';
import { SeriesService } from '../../services/series.service';
import { Series } from '../../../types/interfaces/Tmdb';

@Component({
  selector: 'app-series',
  templateUrl: './series.component.html',
  styleUrls: ['./series.component.scss'],
})
export class SeriesComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  series: Series | undefined;

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
            const series = this.seriesService.getSeriesWatchedLocally(slug);
            const id = series?.show.ids.tmdb;
            if (id === undefined) return of(undefined);
            return of(this.tmdbService.getSeriesLocally(id));
          })
        )
        .subscribe((series) => (this.series = series)),
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}

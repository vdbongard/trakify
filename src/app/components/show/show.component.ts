import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of, Subscription, switchMap } from 'rxjs';
import { TmdbService } from '../../services/tmdb.service';
import { ShowService } from '../../services/show.service';
import { Configuration, Show } from '../../../types/interfaces/Tmdb';
import { ShowWatched } from '../../../types/interfaces/Trakt';

@Component({
  selector: 'app-show',
  templateUrl: './show.component.html',
  styleUrls: ['./show.component.scss'],
})
export class ShowComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  show: Show | undefined;
  tmdbShow: { [key: number]: Show } | undefined;
  config: Configuration | undefined;
  showWatched: ShowWatched | undefined;

  constructor(
    private route: ActivatedRoute,
    private showService: ShowService,
    private tmdbService: TmdbService
  ) {}

  ngOnInit(): void {
    this.subscriptions = [
      this.route.params
        .pipe(
          switchMap((params) => {
            const slug = params['slug'];
            this.showWatched = this.showService.getShowWatchedLocally(slug);
            const id = this.showWatched?.show.ids.tmdb;
            if (id === undefined) return of(undefined);
            return of(this.tmdbService.getShowLocally(id));
          })
        )
        .subscribe((show) => (this.show = show)),
      this.tmdbService.shows.subscribe((show) => (this.tmdbShow = show)),
      this.tmdbService.config.subscribe((config) => (this.config = config)),
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}

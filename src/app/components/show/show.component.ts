import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { TmdbService } from '../../services/tmdb.service';
import { ShowService } from '../../services/show.service';
import { Configuration, Show } from '../../../types/interfaces/Tmdb';
import { ShowProgress, ShowWatched } from '../../../types/interfaces/Trakt';

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
  config?: Configuration;

  constructor(
    private route: ActivatedRoute,
    private showService: ShowService,
    private tmdbService: TmdbService
  ) {}

  ngOnInit(): void {
    this.subscriptions = [
      this.route.params.subscribe((params) => {
        const slug = params['slug'];

        const ids = this.showService.getIdForSlug(slug);
        if (!ids) return;

        this.watched = this.showService.getShowWatchedLocally(ids.trakt);
        this.progress = this.showService.getShowsProgressLocally(ids.trakt);
        this.show = this.tmdbService.getShowLocally(ids.tmdb);
      }),
      this.tmdbService.config.subscribe((config) => (this.config = config)),
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}

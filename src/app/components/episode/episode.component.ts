import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ShowService } from '../../services/show.service';
import { EpisodeProgress } from '../../../types/interfaces/Trakt';

@Component({
  selector: 'app-episode',
  templateUrl: './episode.component.html',
  styleUrls: ['./episode.component.scss'],
})
export class EpisodeComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  episode?: EpisodeProgress;
  slug?: string;

  constructor(private route: ActivatedRoute, public showService: ShowService) {}

  ngOnInit(): void {
    this.subscriptions = [
      this.route.params.subscribe((params) => {
        this.slug = params['slug'];
        if (!this.slug) return;

        const seasonNumber = params['season-number'];
        const episodeNumber = params['episode-number'];

        const ids = this.showService.getIdForSlug(this.slug);
        if (!ids) return;

        this.episode = this.showService.getEpisodeProgressLocally(
          ids.trakt,
          seasonNumber,
          episodeNumber
        );
      }),
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}

import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { ShowService } from '../../../../services/show.service';
import { Episode, EpisodeProgress } from '../../../../../types/interfaces/Trakt';
import { SyncService } from '../../../../services/sync.service';

@Component({
  selector: 'app-episode',
  templateUrl: './episode.component.html',
  styleUrls: ['./episode.component.scss'],
})
export class EpisodeComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  episodeProgress?: EpisodeProgress;
  episode?: Episode;
  slug?: string;

  constructor(
    private route: ActivatedRoute,
    public showService: ShowService,
    private syncService: SyncService
  ) {}

  ngOnInit(): void {
    this.subscriptions = [
      this.route.params.subscribe(async (params) => {
        this.slug = params['slug'];
        if (!this.slug) return;

        const seasonNumber = params['season'];
        const episodeNumber = params['episode'];

        const ids = this.showService.getIdForSlug(this.slug);
        if (!ids) return;

        this.episodeProgress = this.showService.getEpisodeProgressLocally(
          ids.trakt,
          seasonNumber,
          episodeNumber
        );
        if (!this.episodeProgress) return;

        this.episode = undefined;
        await this.syncService.syncShowsEpisodes(ids.trakt, seasonNumber, episodeNumber);
        this.episode = this.showService.getEpisodeLocally(ids.trakt, seasonNumber, episodeNumber);
      }),
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}

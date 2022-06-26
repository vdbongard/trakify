import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { Episode, SeasonProgress, ShowWatched } from '../../../../../types/interfaces/Trakt';
import { ShowService } from '../../../../services/show.service';
import { SyncService } from '../../../../services/sync.service';

@Component({
  selector: 'app-season',
  templateUrl: './season.component.html',
  styleUrls: ['./season.component.scss'],
})
export class SeasonComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  seasonProgress?: SeasonProgress;
  showWatched?: ShowWatched;
  episodes: (Episode | undefined)[] = [];
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

        const ids = this.showService.getIdForSlug(this.slug);
        if (!ids) return;

        this.seasonProgress = this.showService.getSeasonProgress(ids.trakt, seasonNumber);
        if (!this.seasonProgress) return;

        this.showWatched = this.showService.getShowWatched(ids.trakt);
        if (!this.showWatched) return;

        this.episodes = [];
        await Promise.all(
          this.seasonProgress.episodes.map((episodeProgress) =>
            this.syncService.syncShowsEpisodes(ids.trakt, seasonNumber, episodeProgress.number)
          )
        );

        this.seasonProgress.episodes.forEach((episodeProgress) => {
          const episode = this.showService.getEpisode(
            ids.trakt,
            seasonNumber,
            episodeProgress.number
          );
          this.episodes.push(episode);
        });
      }),
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}

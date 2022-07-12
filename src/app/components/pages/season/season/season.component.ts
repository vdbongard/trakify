import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import {
  EpisodeFull,
  Ids,
  SeasonProgress,
  ShowWatched,
  Translation,
} from '../../../../../types/interfaces/Trakt';
import { ShowService } from '../../../../services/show.service';
import { ConfigService } from '../../../../services/config.service';

@Component({
  selector: 'app-season',
  templateUrl: './season.component.html',
  styleUrls: ['./season.component.scss'],
})
export class SeasonComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  seasonProgress?: SeasonProgress;
  showWatched?: ShowWatched;
  episodes: (EpisodeFull | undefined)[] = [];
  episodesTranslations: (Translation | undefined)[] = [];
  slug?: string;
  seasonNumber?: number;
  ids?: Ids;

  constructor(
    private route: ActivatedRoute,
    public showService: ShowService,
    private configService: ConfigService
  ) {}

  ngOnInit(): void {
    this.subscriptions = [
      this.route.params.subscribe(async (params) => {
        this.slug = params['slug'];
        if (!this.slug) return;

        this.ids = this.showService.getIdForSlug(this.slug);
        if (!this.ids) return;

        this.seasonNumber = parseInt(params['season']);
        if (!this.seasonNumber) return;

        this.seasonProgress = this.showService.getSeasonProgress(this.ids.trakt, this.seasonNumber);
        this.showWatched = this.showService.getShowWatched(this.ids.trakt);

        if (this.seasonProgress) {
          this.episodes = [];
          const promises: Promise<void>[] = this.seasonProgress.episodes.map((episodeProgress) =>
            this.showService.syncShowEpisode(
              this.ids?.trakt,
              this.seasonNumber,
              episodeProgress.number
            )
          );

          const language = this.configService.config$.value.language.substring(0, 2);

          if (language !== 'en') {
            promises.push(
              ...this.seasonProgress.episodes.map((episodeProgress) =>
                this.showService.syncShowEpisodeTranslation(
                  this.ids?.trakt,
                  this.seasonNumber,
                  episodeProgress.number,
                  language
                )
              )
            );
          }

          await Promise.all(promises);

          this.seasonProgress.episodes.forEach((episodeProgress) => {
            if (!this.ids || this.seasonNumber === undefined) return;
            const episode = this.showService.getEpisode(
              this.ids.trakt,
              this.seasonNumber,
              episodeProgress.number
            );
            this.episodes.push(episode);
            const episodeTranslation = this.showService.getEpisodeTranslation(
              this.ids.trakt,
              this.seasonNumber,
              episodeProgress.number
            );
            this.episodesTranslations.push(episodeTranslation);
          });
        }
      }),
    ];
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((subscription) => subscription.unsubscribe());
  }
}

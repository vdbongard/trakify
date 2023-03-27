import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EpisodeFull, Show, ShowProgress, ShowWatched } from '@type/Trakt';
import { TmdbSeason, TmdbShow } from '@type/Tmdb';
import { TickerComponent } from '@shared/components/ticker/ticker.component';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RelativeDatePipe } from '@shared/pipes/relativeDate.pipe';
import { IsShowEndedPipe } from '@shared/pipes/is-show-ended.pipe';
import { SimpleChangesTyped } from '@type/SimpleChanges';
import { isPast } from 'date-fns';

@Component({
  selector: 't-show-item-content',
  standalone: true,
  imports: [
    CommonModule,
    TickerComponent,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    RelativeDatePipe,
    IsShowEndedPipe,
  ],
  templateUrl: './show-item-content.component.html',
  styleUrls: ['./show-item-content.component.scss'],
})
export class ShowItemContentComponent implements OnChanges {
  @Input() isLoggedIn?: boolean | null;
  @Input() show?: Show;
  @Input() showWatched?: ShowWatched;
  @Input() showProgress?: ShowProgress;
  @Input() tmdbShow?: TmdbShow | null;
  @Input() tmdbSeason?: TmdbSeason | null;
  @Input() isFavorite?: boolean;
  @Input() episode?: EpisodeFull | null;
  @Input() withYear?: boolean;
  @Input() withEpisode?: boolean;
  @Input() withEpisodesCount?: boolean;
  @Input() withProgressbar?: boolean;
  @Input() withRelativeDate?: boolean;

  @Output() addFavorite = new EventEmitter<Show>();
  @Output() removeFavorite = new EventEmitter<Show>();

  episodes = 0;
  episodesRemaining = 0;
  network?: string;

  ngOnChanges(changes: SimpleChangesTyped<this>): void {
    if (changes.tmdbShow) {
      this.episodes = this.tmdbShow?.number_of_episodes ?? 0;
    }
    if (changes.showProgress) {
      const airedEpisodesByDate = this.getAiredEpisodesByDate();
      const airedEpisodesByProgress = this.showProgress?.aired ?? 0;

      const airedEpisodes =
        airedEpisodesByProgress > airedEpisodesByDate
          ? airedEpisodesByProgress
          : airedEpisodesByDate;

      this.episodesRemaining =
        this.showProgress && this.showProgress.completed > 0
          ? airedEpisodes - this.showProgress.completed
          : 0;
    }
    if (changes.tmdbShow) {
      this.network = this.tmdbShow?.networks?.[0]?.name;
    }
  }

  getAiredEpisodesByDate(): number {
    if (!this.showProgress || !this.episode || !this.tmdbSeason) return 0;

    let overallAired = 0;

    // filter out specials season
    const seasonsProgress = this.showProgress.seasons.filter((season) => season.number !== 0);

    for (const seasonProgress of seasonsProgress) {
      // if current episode season
      if (this.episode.season === seasonProgress.number) {
        const currentSeasonEpisodesAired = this.tmdbSeason.episodes.filter((episode) =>
          episode.air_date ? isPast(new Date(episode.air_date)) : false
        ).length;

        overallAired += currentSeasonEpisodesAired;
        continue;
      }

      // else season progress episode count
      overallAired += seasonProgress.episodes.length;
    }

    return overallAired;
  }

  preventEvent(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
  }
}

import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';

import type { EpisodeFull, SeasonProgress } from '@type/interfaces/Trakt';
import type { TmdbShowSeason } from '@type/interfaces/Tmdb';
import { isPast } from 'date-fns';
import { SeasonTitlePipe } from '../../utils/pipes/season-title.pipe';
import { NgIf } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 't-show-season-item',
  templateUrl: './show-season-item.component.html',
  styleUrls: ['./show-season-item.component.scss'],
  standalone: true,
  imports: [SeasonTitlePipe, NgIf, MatProgressBarModule],
})
export class ShowSeasonItemComponent implements OnChanges {
  @Input() seasonProgress?: SeasonProgress;
  @Input() seasonsEpisodes?: { [seasonNumber: string]: EpisodeFull[] | undefined } | null;
  @Input() season?: TmdbShowSeason;

  episodesAired?: number;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['seasonProgress'] || changes['seasonEpisodes']) {
      this.episodesAired = this.seasonProgress?.aired;
    }
  }

  getEpisodesAiredCount(seasonEpisodes: EpisodeFull[] | undefined): number {
    if (!seasonEpisodes) return 0;
    const seasonEpisodesAired = seasonEpisodes.filter((seasonEpisode) =>
      isPast(new Date(seasonEpisode.first_aired + ''))
    );
    return seasonEpisodesAired.length;
  }
}

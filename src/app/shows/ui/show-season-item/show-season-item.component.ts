import { Component, Input, OnChanges } from '@angular/core';

import type { EpisodeFull, SeasonProgress } from '@type/Trakt';
import type { TmdbShowSeason } from '@type/Tmdb';
import { SeasonTitlePipe } from '../../utils/pipes/season-title.pipe';
import { NgIf } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SimpleChangesTyped } from '@type/SimpleChanges';
import { getAiredEpisodesInSeason } from '@helper/episodes';

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

  episodesAired = 0;

  ngOnChanges(changes: SimpleChangesTyped<this>): void {
    if (changes.seasonProgress || changes.seasonsEpisodes) {
      const seasonNumber = this.seasonProgress?.number ?? this.season?.season_number;
      if (seasonNumber === undefined) return;
      this.episodesAired = getAiredEpisodesInSeason(
        this.seasonsEpisodes?.[seasonNumber] ?? [],
        this.seasonProgress
      );
    }
  }
}

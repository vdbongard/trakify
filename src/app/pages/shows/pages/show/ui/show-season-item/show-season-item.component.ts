import { Component, computed, Input, OnChanges, Signal } from '@angular/core';
import type { EpisodeFull, ShowProgress } from '@type/Trakt';
import type { TmdbShowSeason } from '@type/Tmdb';
import { SeasonTitlePipe } from '../../../../utils/pipes/season-title.pipe';
import { CommonModule } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SimpleChangesTyped } from '@type/SimpleChanges';
import { getAiredEpisodesInSeason } from '@helper/episodes';

@Component({
  selector: 't-show-season-item',
  templateUrl: './show-season-item.component.html',
  styleUrls: ['./show-season-item.component.scss'],
  standalone: true,
  imports: [CommonModule, SeasonTitlePipe, MatProgressBarModule],
})
export class ShowSeasonItemComponent implements OnChanges {
  @Input({ required: true }) showProgress!: Signal<ShowProgress | undefined>;
  @Input() seasonsEpisodes?: Record<string, EpisodeFull[] | undefined> | null;
  @Input() season?: TmdbShowSeason;

  seasonProgress = computed(() => {
    const showProgress = this.showProgress();
    if (!showProgress) return;
    return showProgress.seasons.find((season) => season.number === this.season?.season_number);
  });

  episodesAired = 0;

  ngOnChanges(changes: SimpleChangesTyped<this>): void {
    if (changes.seasonProgress || changes.seasonsEpisodes) {
      const seasonNumber = this.seasonProgress()?.number ?? this.season?.season_number;
      if (seasonNumber === undefined) return;
      this.episodesAired = getAiredEpisodesInSeason(
        this.seasonsEpisodes?.[seasonNumber] ?? [],
        this.seasonProgress(),
      );
    }
  }
}

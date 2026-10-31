import { Component, computed, input } from '@angular/core';
import type { ShowProgress } from '@type/Trakt';
import type { ShowProgressSummary } from '@type/ShowProgress';
import type { TmdbShowSeason } from '@type/Tmdb';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { seasonTitle } from '@helper/seasonTitle';

@Component({
  selector: 't-show-season-item',
  imports: [MatProgressBarModule],
  templateUrl: './show-season-item.component.html',
  styleUrl: './show-season-item.component.scss',
})
export class ShowSeasonItemComponent {
  season = input.required<TmdbShowSeason>();
  progressView = input<ShowProgressSummary>();
  showProgress = input<ShowProgress>();

  seasonProgress = computed(() => {
    const showProgress = this.showProgress();
    if (!showProgress) return;
    return showProgress.seasons?.find((season) => season.number === this.season()?.season_number);
  });

  seasonTitle = computed(() =>
    seasonTitle(this.seasonProgress()?.number ?? this.season()?.season_number),
  );

  episodesAired = computed(() => {
    const seasonNumber = this.season()?.season_number;
    if (seasonNumber === undefined) return 0;
    return this.progressView()?.seasons.get(seasonNumber)?.aired ?? 0;
  });
}

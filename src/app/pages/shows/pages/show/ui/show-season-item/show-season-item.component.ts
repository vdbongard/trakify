import { Component, computed, input } from '@angular/core';
import type { EpisodeFull, ShowProgress } from '@type/Trakt';
import type { TmdbShowSeason } from '@type/Tmdb';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { getAiredEpisodesInSeason } from '@helper/episodes';
import { seasonTitle } from '@helper/seasonTitle';

@Component({
  selector: 't-show-season-item',
  imports: [MatProgressBarModule],
  templateUrl: './show-season-item.component.html',
  styleUrl: './show-season-item.component.scss',
})
export class ShowSeasonItemComponent {
  season = input.required<TmdbShowSeason>();
  seasonsEpisodes = input<Record<string, EpisodeFull[] | undefined>>();
  showProgress = input<ShowProgress>();

  seasonProgress = computed(() => {
    const showProgress = this.showProgress();
    if (!showProgress) return;
    return showProgress.seasons.find((season) => season.number === this.season()?.season_number);
  });

  seasonTitle = computed(() =>
    seasonTitle('Season ' + (this.seasonProgress()?.number ?? this.season()?.season_number)),
  );

  episodesAired = computed(() => {
    const seasonProgress = this.seasonProgress();
    const seasonsEpisodes = this.seasonsEpisodes?.();
    if (!seasonProgress && !seasonsEpisodes) return 0;

    const season = this.season();
    const seasonNumber = seasonProgress?.number ?? season?.season_number;
    if (seasonNumber === undefined) return 0;
    return getAiredEpisodesInSeason(seasonsEpisodes?.[seasonNumber] ?? [], seasonProgress);
  });
}

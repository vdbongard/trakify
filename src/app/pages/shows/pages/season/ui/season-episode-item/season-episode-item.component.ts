import { Component, computed, input, output } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import type { EpisodeFull } from '@type/Trakt';
import { SeasonProgress } from '@type/Trakt';
import { DatePipe } from '@angular/common';

@Component({
  selector: 't-season-episode-item',
  imports: [MatCheckboxModule, DatePipe],
  templateUrl: './season-episode-item.component.html',
  styleUrl: './season-episode-item.component.scss',
})
export class SeasonEpisodeItemComponent {
  i = input(0);
  seasonProgress = input<SeasonProgress>();
  episode = input<EpisodeFull>();
  isLoggedIn = input(false);

  add = output<EpisodeFull>();
  remove = output<EpisodeFull>();

  currentDate = new Date();

  episodeProgress = computed(() => {
    if (!this.seasonProgress() || !this.episode()) return;
    return this.seasonProgress()?.episodes.find((episodeProgress) => {
      return episodeProgress.number === this.episode()!.number;
    });
  });

  episodeAirDate = computed(() => {
    return new Date(this.episode()?.first_aired + '');
  });

  episodeTitle = computed(() => {
    const episode = this.episode();
    const i = this.i();
    return episode?.title && episode?.number !== undefined
      ? episode.title + ' (' + episode.number + ')'
      : 'Episode ' + ((episode?.number ?? i) + 1);
  });

  onClick(event: Event): void {
    event.stopPropagation();
    const episode = this.episode();
    if (!episode) return;
    this.episodeProgress()?.completed ? this.remove.emit(episode) : this.add.emit(episode);
  }
}

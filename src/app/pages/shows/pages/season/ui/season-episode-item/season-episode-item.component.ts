import { Component, computed, EventEmitter, input, Output } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import type { EpisodeFull } from '@type/Trakt';
import { SeasonProgress } from '@type/Trakt';
import { DatePipe } from '@angular/common';

@Component({
  selector: 't-season-episode-item',
  standalone: true,
  imports: [MatCheckboxModule, DatePipe],
  templateUrl: './season-episode-item.component.html',
  styleUrl: './season-episode-item.component.scss',
})
export class SeasonEpisodeItemComponent {
  i = input<number>(0);
  seasonProgress = input<SeasonProgress | null | undefined>();
  episode = input<EpisodeFull | undefined>();
  isLoggedIn = input<boolean | null>();

  @Output() add = new EventEmitter<EpisodeFull>();
  @Output() remove = new EventEmitter<EpisodeFull>();

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
    this.episodeProgress()?.completed
      ? this.remove.emit(this.episode())
      : this.add.emit(this.episode());
  }
}

import { Component, computed, EventEmitter, Input, Output, Signal } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import type { EpisodeFull } from '@type/Trakt';
import { SeasonProgress } from '@type/Trakt';
import { CommonModule, DatePipe } from '@angular/common';
import { AirDatePipe } from '../../../../utils/pipes/episode-air-date.pipe';
import { EpisodeTitleWithIndexPipe } from '../../../../utils/pipes/episode-title-with-index.pipe';

@Component({
  selector: 't-season-episode-item',
  templateUrl: './season-episode-item.component.html',
  styleUrls: ['./season-episode-item.component.scss'],
  standalone: true,
  imports: [CommonModule, MatCheckboxModule, AirDatePipe, EpisodeTitleWithIndexPipe, DatePipe],
})
export class SeasonEpisodeItemComponent {
  @Input() isLoggedIn?: boolean | null;
  @Input() i = 0;
  @Input({ required: true }) seasonProgress!: Signal<SeasonProgress | null | undefined>;
  @Input() episode?: EpisodeFull;

  @Output() add = new EventEmitter<EpisodeFull>();
  @Output() remove = new EventEmitter<EpisodeFull>();

  currentDate = new Date();

  episodeProgress = computed(() => {
    if (!this.seasonProgress() || !this.episode) return;
    return this.seasonProgress()?.episodes.find((episodeProgress) => {
      return episodeProgress.number === this.episode?.number;
    });
  });

  onClick(event: Event): void {
    event.stopPropagation();
    this.episodeProgress()?.completed
      ? this.remove.emit(this.episode)
      : this.add.emit(this.episode);
  }
}

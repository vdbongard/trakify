import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatCheckboxModule } from '@angular/material/checkbox';

import type { EpisodeFull, EpisodeProgress } from '@type/Trakt';
import { DatePipe, NgIf } from '@angular/common';
import { AirDatePipe } from '../../utils/pipes/episode-air-date.pipe';
import { EpisodeTitleWithIndexPipe } from '../../utils/pipes/episode-title-with-index.pipe';

@Component({
  selector: 't-season-episode-item',
  templateUrl: './season-episode-item.component.html',
  styleUrls: ['./season-episode-item.component.scss'],
  standalone: true,
  imports: [MatCheckboxModule, NgIf, AirDatePipe, EpisodeTitleWithIndexPipe, DatePipe],
})
export class SeasonEpisodeItemComponent {
  @Input() isLoggedIn?: boolean | null;
  @Input() i = 0;
  @Input() episodeProgress: EpisodeProgress | undefined;
  @Input() episode?: EpisodeFull;

  @Output() add = new EventEmitter<EpisodeFull>();
  @Output() remove = new EventEmitter<EpisodeFull>();

  currentDate = new Date();

  onClick(event: Event): void {
    event.stopPropagation();
    this.episodeProgress?.completed ? this.remove.emit(this.episode) : this.add.emit(this.episode);
  }
}

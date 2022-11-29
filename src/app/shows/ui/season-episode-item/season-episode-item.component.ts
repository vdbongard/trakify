import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { MatCheckbox, MatCheckboxModule } from '@angular/material/checkbox';

import type { EpisodeFull, EpisodeProgress } from '@type/interfaces/Trakt';
import { DatePipe, NgIf } from '@angular/common';
import { AirDatePipe } from '../../utils/pipes/episode-air-date.pipe';
import { EpisodeTitleWithIndexPipe } from '../../utils/pipes/episode-title-with-index.pipe';

@Component({
  selector: 't-season-episode-item',
  templateUrl: './season-episode-item.component.html',
  styleUrls: ['./season-episode-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatCheckboxModule, NgIf, AirDatePipe, EpisodeTitleWithIndexPipe, DatePipe],
})
export class SeasonEpisodeItemComponent {
  @Input() isLoggedIn?: boolean | null;
  @Input() i = 0;
  @Input() episodeProgress: EpisodeProgress | undefined;
  @Input() episode?: EpisodeFull;

  @ViewChild(MatCheckbox) checkbox?: MatCheckbox;

  @Output() add = new EventEmitter<EpisodeFull>();
  @Output() remove = new EventEmitter<EpisodeFull>();

  currentDate = new Date();

  onClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.checkbox?.checked ? this.remove.emit(this.episode) : this.add.emit(this.episode);
  }
}

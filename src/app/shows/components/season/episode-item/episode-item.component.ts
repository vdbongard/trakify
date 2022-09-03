import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatCheckbox } from '@angular/material/checkbox';

import type { EpisodeFull, EpisodeProgress } from 'src/types/interfaces/Trakt';

@Component({
  selector: 't-episode-item',
  templateUrl: './episode-item.component.html',
  styleUrls: ['./episode-item.component.scss'],
})
export class EpisodeItemComponent {
  @Input() i = 0;
  @Input() episodeProgress?: EpisodeProgress;
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

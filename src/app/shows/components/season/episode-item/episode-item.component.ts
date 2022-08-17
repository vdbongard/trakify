import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { EpisodeFull, EpisodeProgress } from '../../../../../types/interfaces/Trakt';
import { MatCheckbox } from '@angular/material/checkbox';

@Component({
  selector: 't-episode-item',
  templateUrl: './episode-item.component.html',
  styleUrls: ['./episode-item.component.scss'],
})
export class EpisodeItemComponent implements OnChanges {
  @Input() index = 0;
  @Input() episodeProgress?: EpisodeProgress;
  @Input() episode?: EpisodeFull;

  @ViewChild(MatCheckbox) checkbox?: MatCheckbox;

  @Output() add = new EventEmitter<EpisodeFull>();
  @Output() remove = new EventEmitter<EpisodeFull>();

  currentDate = new Date();
  episodeAirDate?: Date;

  ngOnChanges(changes: SimpleChanges): void {
    const episode = changes['episode'].currentValue;
    this.episodeAirDate = episode ? new Date(episode.first_aired) : undefined;
  }

  onClick(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.checkbox?.checked ? this.remove.emit(this.episode) : this.add.emit(this.episode);
  }
}

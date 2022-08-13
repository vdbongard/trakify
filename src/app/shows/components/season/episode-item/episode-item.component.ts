import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { EpisodeFull, EpisodeProgress } from '../../../../../types/interfaces/Trakt';

@Component({
  selector: 'app-episode-item',
  templateUrl: './episode-item.component.html',
  styleUrls: ['./episode-item.component.scss'],
})
export class EpisodeItemComponent implements OnChanges {
  @Input() index = 0;
  @Input() episodeProgress?: EpisodeProgress;
  @Input() episode?: EpisodeFull;

  currentDate = new Date();
  episodeAirDate?: Date;

  ngOnChanges(changes: SimpleChanges): void {
    const episode = changes['episode'].currentValue;
    this.episodeAirDate = episode ? new Date(episode.first_aired) : undefined;
  }
}

import { Component, Input } from '@angular/core';
import { EpisodeFull, EpisodeProgress } from '../../../../../../types/interfaces/Trakt';

@Component({
  selector: 'app-episode-item',
  templateUrl: './episode-item.component.html',
  styleUrls: ['./episode-item.component.scss'],
})
export class EpisodeItemComponent {
  @Input() index = 0;
  @Input() episodeProgress?: EpisodeProgress;
  @Input() episode?: EpisodeFull;
}

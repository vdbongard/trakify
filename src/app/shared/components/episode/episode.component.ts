import { Component, EventEmitter, Input, Output } from '@angular/core';

import type { EpisodeFull, EpisodeProgress, Show } from '@type/interfaces/Trakt';
import type { TmdbEpisode } from '@type/interfaces/Tmdb';

@Component({
  selector: 't-episode',
  templateUrl: './episode.component.html',
  styleUrls: ['./episode.component.scss'],
})
export class EpisodeComponent {
  @Input() show?: Show;
  @Input() episode?: EpisodeFull | null;
  @Input() episodeProgress?: EpisodeProgress;
  @Input() tmdbEpisode?: TmdbEpisode | null;
  @Input() imgPrefix?: string;
  @Input() isSeenLoading?: boolean;

  @Output() add = new EventEmitter();
  @Output() remove = new EventEmitter();

  stillLoaded = false;
}

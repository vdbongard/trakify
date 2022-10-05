import { Component, EventEmitter, Input, Output } from '@angular/core';

import type { EpisodeFull, EpisodeProgress, Show } from '@type/interfaces/Trakt';
import type { TmdbEpisode } from '@type/interfaces/Tmdb';
import { StillPrefix } from '@constants';
import * as Paths from 'src/app/paths';

@Component({
  selector: 't-episode',
  templateUrl: './episode.component.html',
  styleUrls: ['./episode.component.scss'],
})
export class EpisodeComponent {
  @Input() show?: Show | null;
  @Input() episode?: EpisodeFull | null;
  @Input() episodeProgress?: EpisodeProgress | null;
  @Input() tmdbEpisode?: TmdbEpisode | null;
  @Input() isSeenLoading?: boolean;

  @Output() add = new EventEmitter<{ episode?: EpisodeFull; show: Show }>();
  @Output() remove = new EventEmitter<{ episode?: EpisodeFull; show: Show }>();

  stillLoaded = false;
  stillPrefix = StillPrefix;
  paths = Paths;
}

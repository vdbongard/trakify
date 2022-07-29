import { Component, EventEmitter, Input, Output } from '@angular/core';
import { EpisodeFull, EpisodeProgress, TraktShow } from '../../../../types/interfaces/Trakt';
import { TmdbEpisode } from '../../../../types/interfaces/Tmdb';

@Component({
  selector: 'app-episode',
  templateUrl: './episode.component.html',
  styleUrls: ['./episode.component.scss'],
})
export class EpisodeComponent {
  @Input() params?: { slug?: string; season?: string; number?: string };
  @Input() show?: TraktShow;
  @Input() episode?: EpisodeFull | null;
  @Input() episodeProgress?: EpisodeProgress;
  @Input() tmdbEpisode?: TmdbEpisode;
  @Input() imgPrefix?: string;

  @Output() addToHistory = new EventEmitter();
  @Output() removeFromHistory = new EventEmitter();
}

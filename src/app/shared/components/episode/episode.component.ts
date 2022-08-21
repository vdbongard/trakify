import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { EpisodeFull, EpisodeProgress, Show } from '../../../../types/interfaces/Trakt';
import { TmdbEpisode } from '../../../../types/interfaces/Tmdb';

@Component({
  selector: 't-episode',
  templateUrl: './episode.component.html',
  styleUrls: ['./episode.component.scss'],
})
export class EpisodeComponent implements OnChanges {
  @Input() params?: { slug?: string; season?: string; number?: string };
  @Input() show?: Show;
  @Input() episode?: EpisodeFull | null;
  @Input() episodeProgress?: EpisodeProgress;
  @Input() tmdbEpisode?: TmdbEpisode | null;
  @Input() imgPrefix?: string;
  @Input() isSeenLoading?: boolean;

  @Output() add = new EventEmitter();
  @Output() remove = new EventEmitter();

  stillLoaded = false;

  ngOnChanges(changes: SimpleChanges): void {
    console.debug('EpisodeComponent changes', changes);
  }
}

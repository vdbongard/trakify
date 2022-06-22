import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { EpisodeFull, EpisodeProgress } from '../../../../types/interfaces/Trakt';
import { TmdbEpisode } from '../../../../types/interfaces/Tmdb';

@Component({
  selector: 'app-episode',
  templateUrl: './episode.component.html',
  styleUrls: ['./episode.component.scss'],
})
export class EpisodeComponent implements OnInit {
  @Input() episode?: EpisodeFull;
  @Input() episodeProgress?: EpisodeProgress;
  @Input() tmdbEpisode?: TmdbEpisode;
  @Input() imgPrefix?: string;

  @Output() addToHistory = new EventEmitter();
  @Output() removeFromHistory = new EventEmitter();
  @Output() imgClick = new EventEmitter();

  ngOnInit(): void {}
}

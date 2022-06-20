import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { EpisodeFull, EpisodeProgress } from '../../../../types/interfaces/Trakt';
import { Episode } from '../../../../types/interfaces/Tmdb';

@Component({
  selector: 'app-episode',
  templateUrl: './episode.component.html',
  styleUrls: ['./episode.component.scss'],
})
export class EpisodeComponent implements OnInit {
  @Input() episode?: EpisodeFull;
  @Input() episodeProgress?: EpisodeProgress;
  @Input() tmdbEpisode?: Episode;
  @Input() imgPrefix?: string;

  @Output() addToHistory = new EventEmitter();
  @Output() removeFromHistory = new EventEmitter();

  ngOnInit(): void {}
}

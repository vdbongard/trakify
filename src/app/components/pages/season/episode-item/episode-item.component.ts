import { Component, Input, OnInit } from '@angular/core';
import { Episode, EpisodeProgress } from '../../../../../types/interfaces/Trakt';

@Component({
  selector: 'app-episode-item',
  templateUrl: './episode-item.component.html',
  styleUrls: ['./episode-item.component.scss'],
})
export class EpisodeItemComponent implements OnInit {
  @Input() episodeProgress?: EpisodeProgress;
  @Input() episode?: Episode | undefined;

  ngOnInit(): void {}
}

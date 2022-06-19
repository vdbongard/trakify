import { Component, Input, OnInit } from '@angular/core';
import { EpisodeProgress } from '../../../../../types/interfaces/Trakt';

@Component({
  selector: 'app-episode-item',
  templateUrl: './episode-item.component.html',
  styleUrls: ['./episode-item.component.scss'],
})
export class EpisodeItemComponent implements OnInit {
  @Input() episode?: EpisodeProgress;

  ngOnInit(): void {}
}

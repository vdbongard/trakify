import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ShowProgress, ShowWatched } from '../../../../types/interfaces/Trakt';
import { TmdbShow } from '../../../../types/interfaces/Tmdb';

@Component({
  selector: 'app-show-item',
  templateUrl: './show-item.component.html',
  styleUrls: ['./show-item.component.scss'],
})
export class ShowItemComponent implements OnInit {
  @Input() watched?: ShowWatched;
  @Input() progress?: ShowProgress;
  @Input() imgPrefix?: string;
  @Input() tmdbShow?: TmdbShow;
  @Input() favorite?: boolean;

  @Output() addFavorite = new EventEmitter();
  @Output() removeFavorite = new EventEmitter();

  ngOnInit(): void {}
}

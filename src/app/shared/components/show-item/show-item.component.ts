import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  EpisodeFull,
  ShowProgress,
  ShowWatched,
  TraktShow,
} from '../../../../types/interfaces/Trakt';
import { TmdbShow } from '../../../../types/interfaces/Tmdb';
import { MatMenu } from '@angular/material/menu';
import { BehaviorSubject } from 'rxjs';
import { LoadingState } from '../../../../types/enum';

@Component({
  selector: 'app-show-item',
  templateUrl: './show-item.component.html',
  styleUrls: ['./show-item.component.scss'],
})
export class ShowItemComponent {
  @Input() show?: TraktShow;
  @Input() showWatched?: ShowWatched;
  @Input() progress?: ShowProgress;
  @Input() imgPrefix?: string;
  @Input() tmdbShow?: TmdbShow;
  @Input() isFavorite?: boolean;
  @Input() isWatchlist?: boolean;
  @Input() episode?: EpisodeFull | null;
  @Input() withYear?: boolean;
  @Input() withEpisode?: boolean;
  @Input() withAddButtons?: boolean;
  @Input() withEpisodesCount?: boolean;
  @Input() withProgressbar?: boolean;
  @Input() withRelativeDate?: boolean;
  @Input() menu?: MatMenu;

  @Output() addFavorite = new EventEmitter();
  @Output() removeFavorite = new EventEmitter();
  @Output() addShow = new EventEmitter();
  @Output() removeShow = new EventEmitter();
  @Output() manageLists = new EventEmitter();

  posterState = new BehaviorSubject<LoadingState>(LoadingState.LOADING);
  state = LoadingState;

  preventEvent(event: Event): void {
    event.stopPropagation();
    event.preventDefault();
  }
}

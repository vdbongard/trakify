import { Component, EventEmitter, Input, Output } from '@angular/core';
import { TmdbConfiguration } from '../../../../types/interfaces/Tmdb';
import { ShowInfo } from '../../../../types/interfaces/Show';
import { MatMenu } from '@angular/material/menu';

@Component({
  selector: 'app-shows',
  templateUrl: './shows.component.html',
  styleUrls: ['./shows.component.scss'],
})
export class ShowsComponent {
  @Input() showsInfos?: ShowInfo[] = [];
  @Input() tmdbConfig?: TmdbConfiguration | null;
  @Input() withYear?: boolean;
  @Input() withEpisode?: boolean;
  @Input() withAddButtons?: boolean;
  @Input() withLinkToEpisode?: boolean;
  @Input() withEpisodesCount?: boolean;
  @Input() withProgressbar?: boolean;
  @Input() withRelativeDate?: boolean;
  @Input() menu?: MatMenu;

  @Output() addFavorite = new EventEmitter();
  @Output() removeFavorite = new EventEmitter();
  @Output() addShow = new EventEmitter();
  @Output() removeShow = new EventEmitter();
  @Output() manageLists = new EventEmitter();

  showId(index: number, showInfo: ShowInfo): number | undefined {
    return showInfo.show?.ids.trakt;
  }
}

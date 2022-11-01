import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatMenu } from '@angular/material/menu';

import type { ShowInfo } from '@type/interfaces/Show';
import * as Paths from 'src/app/paths';
import { Show } from '@type/interfaces/Trakt';

@Component({
  selector: 't-shows',
  templateUrl: './shows.component.html',
  styleUrls: ['./shows.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowsComponent {
  @Input() isLoggedIn?: boolean | null;
  @Input() showsInfos?: ShowInfo[];
  @Input() withYear?: boolean;
  @Input() withEpisode?: boolean;
  @Input() withAddButtons?: boolean;
  @Input() withLinkToEpisode?: boolean;
  @Input() withEpisodesCount?: boolean;
  @Input() withProgressbar?: boolean;
  @Input() withRelativeDate?: boolean;
  @Input() menu?: MatMenu;
  @Input() back?: string;

  @Output() addFavorite = new EventEmitter<Show>();
  @Output() removeFavorite = new EventEmitter<Show>();
  @Output() add = new EventEmitter<Show>();
  @Output() remove = new EventEmitter<Show>();

  paths = Paths;

  id(index: number, showInfo: ShowInfo): string {
    return '' + showInfo.show?.ids.trakt + showInfo.nextEpisode?.ids.trakt;
  }
}

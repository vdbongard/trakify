import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatMenu } from '@angular/material/menu';

import type { ShowInfo } from '@type/interfaces/Show';
import * as Paths from 'src/app/paths';

@Component({
  selector: 't-shows',
  templateUrl: './shows.component.html',
  styleUrls: ['./shows.component.scss'],
})
export class ShowsComponent {
  @Input() showsInfos?: ShowInfo[];
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
  @Output() add = new EventEmitter();
  @Output() remove = new EventEmitter();
  @Output() manageLists = new EventEmitter();

  paths = Paths;

  showSlug(index: number, showInfo: ShowInfo): string | undefined {
    return showInfo.show?.ids.slug;
  }
}

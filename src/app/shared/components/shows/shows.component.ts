import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatMenu } from '@angular/material/menu';
import type { ShowInfo } from '@type/Show';
import * as Paths from '@shared/paths';
import { Show } from '@type/Trakt';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { TransitionGroupDirective } from '../../directives/transition-group.directive';
import { TransitionGroupItemDirective } from '../../directives/transition-group-item.directive';
import { ShowItemWrapperComponent } from '@shared/components/shows/show-item-wrapper/show-item-wrapper.component';

@Component({
  selector: 't-shows',
  standalone: true,
  imports: [
    RouterModule,
    MatListModule,
    TransitionGroupDirective,
    TransitionGroupItemDirective,
    ShowItemWrapperComponent,
  ],
  templateUrl: './shows.component.html',
  styleUrl: './shows.component.scss',
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
  @Input() transitionDisabled?: boolean;

  @Output() addFavorite = new EventEmitter<Show>();
  @Output() removeFavorite = new EventEmitter<Show>();
  @Output() add = new EventEmitter<Show>();
  @Output() remove = new EventEmitter<Show>();

  protected readonly Paths = Paths;

  id(showInfo: ShowInfo): string {
    return '' + showInfo.show?.ids.trakt + showInfo.nextEpisode?.ids.trakt;
  }
}

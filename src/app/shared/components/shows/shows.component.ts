import { booleanAttribute, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatMenu } from '@angular/material/menu';
import type { ShowInfo } from '@type/Show';
import * as Paths from '@shared/paths';
import { Show } from '@type/Trakt';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { TransitionGroupDirective } from '../../directives/transition-group.directive';
import { TransitionGroupItemDirective } from '../../directives/transition-group-item.directive';
import { ShowItemWrapperComponent } from '@shared/components/shows/show-item-wrapper/show-item-wrapper.component';
import { getShowWithEpisodeId } from '@helper/IdGetters';

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
  @Input() showsInfos?: ShowInfo[];
  @Input() menu?: MatMenu;
  @Input() back?: string;
  @Input({ transform: booleanAttribute }) isLoggedIn?: boolean;
  @Input({ transform: booleanAttribute }) withYear?: boolean;
  @Input({ transform: booleanAttribute }) withEpisode?: boolean;
  @Input({ transform: booleanAttribute }) withAddButtons?: boolean;
  @Input({ transform: booleanAttribute }) withLinkToEpisode?: boolean;
  @Input({ transform: booleanAttribute }) withEpisodesCount?: boolean;
  @Input({ transform: booleanAttribute }) withProgressbar?: boolean;
  @Input({ transform: booleanAttribute }) withRelativeDate?: boolean;
  @Input({ transform: booleanAttribute }) withoutCustomProperty?: boolean;
  @Input({ transform: booleanAttribute }) transitionDisabled?: boolean;

  @Output() addFavorite = new EventEmitter<Show>();
  @Output() removeFavorite = new EventEmitter<Show>();
  @Output() add = new EventEmitter<Show>();
  @Output() remove = new EventEmitter<Show>();

  protected readonly Paths = Paths;

  id(showInfo: ShowInfo): string {
    return getShowWithEpisodeId(showInfo.show, showInfo.nextEpisode);
  }
}

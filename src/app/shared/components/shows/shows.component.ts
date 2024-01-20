import { booleanAttribute, Component, EventEmitter, input, Output } from '@angular/core';
import { MatMenu } from '@angular/material/menu';
import type { ShowInfo } from '@type/Show';
import * as Paths from '@shared/paths';
import { Show } from '@type/Trakt';
import { RouterModule } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { TransitionGroupDirective } from '../../directives/transition-group.directive';
import { TransitionGroupItemDirective } from '../../directives/transition-group-item.directive';
import { ShowListItemWrapperComponent } from '@shared/components/shows/show-list-item-wrapper/show-list-item-wrapper.component';
import { getShowWithEpisodeId } from '@helper/IdGetters';

@Component({
  selector: 't-shows',
  standalone: true,
  imports: [
    RouterModule,
    MatListModule,
    TransitionGroupDirective,
    TransitionGroupItemDirective,
    ShowListItemWrapperComponent,
  ],
  templateUrl: './shows.component.html',
  styleUrl: './shows.component.scss',
})
export class ShowsComponent {
  showsInfos = input<ShowInfo[]>();
  menu = input<MatMenu | null>(null);
  back = input<string>();
  isLoggedIn = input(false, { transform: booleanAttribute });
  withYear = input(false, { transform: booleanAttribute });
  withEpisode = input(false, { transform: booleanAttribute });
  withAddButtons = input(false, { transform: booleanAttribute });
  withLinkToEpisode = input(false, { transform: booleanAttribute });
  withEpisodesCount = input(false, { transform: booleanAttribute });
  withProgressbar = input(false, { transform: booleanAttribute });
  withRelativeDate = input(false, { transform: booleanAttribute });
  withoutCustomProperty = input(false, { transform: booleanAttribute });
  transitionDisabled = input(false, { transform: booleanAttribute });

  @Output() addFavorite = new EventEmitter<Show>();
  @Output() removeFavorite = new EventEmitter<Show>();
  @Output() add = new EventEmitter<Show>();
  @Output() remove = new EventEmitter<Show>();

  protected readonly Paths = Paths;

  id(showInfo: ShowInfo): string {
    return getShowWithEpisodeId(showInfo.show, showInfo.nextEpisode);
  }
}

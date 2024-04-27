import { Component, booleanAttribute, input, output } from '@angular/core';
import { MatListModule } from '@angular/material/list';
import type { MatMenu } from '@angular/material/menu';
import { RouterModule } from '@angular/router';
import { getShowWithEpisodeId } from '@helper/IdGetters';
import { ShowListItemWrapperComponent } from '@shared/components/shows/show-list-item-wrapper/show-list-item-wrapper.component';
import * as Paths from '@shared/paths';
import type { ShowInfo } from '@type/Show';
import type { Show } from '@type/Trakt';
import { TransitionGroupItemDirective } from '../../directives/transition-group-item.directive';
import { TransitionGroupDirective } from '../../directives/transition-group.directive';

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
  menu = input<MatMenu>();
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

  addFavorite = output<Show>();
  removeFavorite = output<Show>();
  add = output<Show>();
  remove = output<Show>();

  protected readonly Paths = Paths;

  id(showInfo: ShowInfo): string {
    return getShowWithEpisodeId(showInfo.show, showInfo.nextEpisode);
  }
}

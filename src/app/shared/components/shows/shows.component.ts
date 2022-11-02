import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { MatMenu } from '@angular/material/menu';

import type { ShowInfo } from '@type/interfaces/Show';
import * as Paths from 'src/app/paths';
import { Show } from '@type/interfaces/Trakt';
import { NgGenericPipeModule } from 'ng-generic-pipe';
import { RouterModule } from '@angular/router';
import { ShowItemComponent } from '../show-item/show-item.component';
import { MatListModule } from '@angular/material/list';
import { ShowSlugPipe } from '../../pipes/show-slug.pipe';
import { NgForOf, NgIf } from '@angular/common';
import { TransitionGroupDirective } from '../../directives/transition-group.directive';
import { TransitionGroupItemDirective } from '../../directives/transition-group-item.directive';
import { MatRippleModule } from '@angular/material/core';
import { HideRippleOnScrollDirective } from '../../directives/hide-ripple-on-scroll.directive';

@Component({
  selector: 't-shows',
  templateUrl: './shows.component.html',
  styleUrls: ['./shows.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NgGenericPipeModule,
    RouterModule,
    ShowItemComponent,
    MatListModule,
    ShowSlugPipe,
    NgIf,
    NgForOf,
    TransitionGroupDirective,
    TransitionGroupItemDirective,
    MatRippleModule,
    HideRippleOnScrollDirective,
  ],
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

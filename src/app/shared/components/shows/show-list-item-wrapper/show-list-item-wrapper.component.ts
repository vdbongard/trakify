import { Component, computed, input, output } from '@angular/core';
import * as Paths from '@shared/paths';
import { HideRippleOnScrollDirective } from '@shared/directives/hide-ripple-on-scroll.directive';
import { MatListModule } from '@angular/material/list';
import { MatRippleModule } from '@angular/material/core';
import { ShowListItemComponent } from '@shared/components/shows/show-list-item/show-list-item.component';
import { RouterLink } from '@angular/router';
import type { ShowInfo } from '@type/Show';
import type { MatMenu } from '@angular/material/menu';
import type { Show } from '@type/Trakt';
import { getShowSlug } from '@helper/getShowSlug';

@Component({
  selector: 't-show-list-item-wrapper',
  standalone: true,
  imports: [
    HideRippleOnScrollDirective,
    MatListModule,
    MatRippleModule,
    ShowListItemComponent,
    RouterLink,
  ],
  templateUrl: './show-list-item-wrapper.component.html',
  styleUrl: './show-list-item-wrapper.component.scss',
})
export class ShowListItemWrapperComponent {
  showInfo = input.required<ShowInfo>();
  back = input<string>();
  menu = input<MatMenu>();
  i = input<number>();
  withLinkToEpisode = input<boolean>();
  isLoggedIn = input<boolean>();
  withYear = input<boolean>();
  withEpisode = input<boolean>();
  withAddButtons = input<boolean>();
  withEpisodesCount = input<boolean>();
  withProgressbar = input<boolean>();
  withRelativeDate = input<boolean>();
  withoutCustomProperty = input<boolean>();

  addFavorite = output<Show>();
  removeFavorite = output<Show>();
  add = output<Show>();
  remove = output<Show>();

  showSlug = computed(() => getShowSlug(this.showInfo().show));
  episodeLink = computed(() =>
    Paths.episode({
      show: this.showSlug(),
      season: `${this.showInfo().nextEpisode?.season}`,
      episode: `${this.showInfo().nextEpisode?.number}`,
    }),
  );
  showLink = computed(() => Paths.show({ show: this.showSlug() }));
}

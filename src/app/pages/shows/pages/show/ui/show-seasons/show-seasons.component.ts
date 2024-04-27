import { Component, computed, input } from '@angular/core';
import { MatRippleModule } from '@angular/material/core';
import { MatListModule } from '@angular/material/list';
import { RouterLink } from '@angular/router';
import { getShowSlug } from '@helper/getShowSlug';
import { HideRippleOnScrollDirective } from '@shared/directives/hide-ripple-on-scroll.directive';
import * as Paths from '@shared/paths';
import type { TmdbShow } from '@type/Tmdb';
import type { EpisodeFull, Show, ShowProgress } from '@type/Trakt';
import { ShowSeasonItemComponent } from '../show-season-item/show-season-item.component';

@Component({
  selector: 't-show-seasons',
  standalone: true,
  imports: [
    MatListModule,
    MatRippleModule,
    HideRippleOnScrollDirective,
    RouterLink,
    ShowSeasonItemComponent,
  ],
  templateUrl: './show-seasons.component.html',
  styleUrl: './show-seasons.component.scss',
})
export class ShowSeasonsComponent {
  showProgress = input<ShowProgress>();
  show = input<Show>();
  seasonsEpisodes = input<Record<string, EpisodeFull[] | undefined>>();
  tmdbShow = input<TmdbShow>();
  back = input<string>();

  showSlug = computed(() => getShowSlug(this.show()));

  protected readonly Paths = Paths;
}

import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { EpisodeFull, Show, ShowProgress } from '@type/Trakt';
import { TmdbShow } from '@type/Tmdb';
import * as Paths from '@shared/paths';
import { MatListModule } from '@angular/material/list';
import { MatRippleModule } from '@angular/material/core';
import { HideRippleOnScrollDirective } from '@shared/directives/hide-ripple-on-scroll.directive';
import { RouterLink } from '@angular/router';
import { ShowSeasonItemComponent } from '../show-season-item/show-season-item.component';
import { getShowSlug } from '@helper/getShowSlug';

@Component({
  selector: 't-show-seasons',
  imports: [
    MatListModule,
    MatRippleModule,
    HideRippleOnScrollDirective,
    RouterLink,
    ShowSeasonItemComponent,
  ],
  templateUrl: './show-seasons.component.html',
  styleUrl: './show-seasons.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
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

import { Component, computed, Input, Signal } from '@angular/core';
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
  templateUrl: './show-seasons.component.html',
  styleUrls: ['./show-seasons.component.scss'],
  standalone: true,
  imports: [
    MatListModule,
    MatRippleModule,
    HideRippleOnScrollDirective,
    RouterLink,
    ShowSeasonItemComponent,
  ],
})
export class ShowSeasonsComponent {
  @Input({ required: true }) showProgress!: Signal<ShowProgress | undefined>;
  @Input({ required: true }) show!: Signal<Show | undefined>;
  @Input({ required: true }) seasonsEpisodes!: Signal<
    Record<string, EpisodeFull[] | undefined> | undefined
  >;
  @Input() tmdbShow?: TmdbShow | null;
  @Input() back?: string;

  showSlug = computed(() => getShowSlug(this.show()));

  protected readonly Paths = Paths;
}

import { Component, computed, input, output } from '@angular/core';
import { Episode, EpisodeFull, SeasonProgress, Show } from '@type/Trakt';
import * as Paths from '@shared/paths';
import { MatListModule } from '@angular/material/list';
import { MatRippleModule } from '@angular/material/core';
import { HideRippleOnScrollDirective } from '@shared/directives/hide-ripple-on-scroll.directive';
import { RouterLink } from '@angular/router';
import { SeasonEpisodeItemComponent } from '../season-episode-item/season-episode-item.component';
import { getShowSlug } from '@helper/getShowSlug';

@Component({
  selector: 't-season-episodes',
  imports: [
    MatListModule,
    MatRippleModule,
    HideRippleOnScrollDirective,
    RouterLink,
    SeasonEpisodeItemComponent,
  ],
  templateUrl: './season-episodes.component.html',
  styleUrl: './season-episodes.component.scss',
})
export class SeasonEpisodesComponent {
  seasonNumber = input.required<string>();
  seasonProgress = input<SeasonProgress>();
  episodes = input<EpisodeFull[]>();
  show = input<Show>();
  isLoggedIn = input(false);

  addEpisode = output<{ episode: Episode; show: Show }>();
  removeEpisode = output<{ episode: Episode; show: Show }>();

  showSlug = computed(() => getShowSlug(this.show()));

  back = history.state?.back;

  protected readonly Paths = Paths;
}

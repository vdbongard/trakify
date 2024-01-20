import { Component, computed, EventEmitter, input, Output } from '@angular/core';
import { Episode, EpisodeFull, SeasonProgress, Show } from '@type/Trakt';
import * as Paths from '@shared/paths';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { MatListModule } from '@angular/material/list';
import { MatRippleModule } from '@angular/material/core';
import { HideRippleOnScrollDirective } from '@shared/directives/hide-ripple-on-scroll.directive';
import { RouterLink } from '@angular/router';
import { SeasonEpisodeItemComponent } from '../season-episode-item/season-episode-item.component';
import { State } from '@type/State';
import { getShowSlug } from '@helper/getShowSlug';

@Component({
  selector: 't-season-episodes',
  standalone: true,
  imports: [
    LoadingComponent,
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
  seasonProgress = input.required<SeasonProgress | null | undefined>();
  episodes = input.required<EpisodeFull[] | null | undefined>();
  show = input.required<Show | undefined>();
  seasonNumber = input.required<string>();
  isLoggedIn = input<boolean | null>();

  @Output() addEpisode = new EventEmitter<{ episode: Episode; show: Show }>();
  @Output() removeEpisode = new EventEmitter<{ episode: Episode; show: Show }>();

  showSlug = computed(() => getShowSlug(this.show()));

  back = (history.state as State).back;

  protected readonly Paths = Paths;
}

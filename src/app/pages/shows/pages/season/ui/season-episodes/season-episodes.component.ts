import { Component, computed, EventEmitter, Input, Output, Signal } from '@angular/core';
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
  templateUrl: './season-episodes.component.html',
  styleUrl: './season-episodes.component.scss',
  standalone: true,
  imports: [
    LoadingComponent,
    MatListModule,
    MatRippleModule,
    HideRippleOnScrollDirective,
    RouterLink,
    SeasonEpisodeItemComponent,
  ],
})
export class SeasonEpisodesComponent {
  @Input({ required: true }) seasonProgress!: Signal<SeasonProgress | null | undefined>;
  @Input({ required: true }) episodes!: EpisodeFull[] | null | undefined;
  @Input({ required: true }) show!: Signal<Show | undefined>;
  @Input() isLoggedIn?: boolean | null;
  @Input() seasonNumber?: string | null;

  @Output() addEpisode = new EventEmitter<{ episode: Episode; show: Show }>();
  @Output() removeEpisode = new EventEmitter<{ episode: Episode; show: Show }>();

  protected readonly Paths = Paths;
  back = (history.state as State).back;

  showSlug = computed(() => getShowSlug(this.show()));
}

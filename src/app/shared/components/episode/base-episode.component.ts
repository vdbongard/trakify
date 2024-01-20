import { booleanAttribute, Component, computed, EventEmitter, input, Output } from '@angular/core';
import type { EpisodeFull, EpisodeProgress, Show } from '@type/Trakt';
import type { TmdbEpisode } from '@type/Tmdb';
import * as Paths from '@shared/paths';
import { DatePipe, DecimalPipe, NgOptimizedImage, NgTemplateOutlet } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { State } from '@type/State';
import { getShowSlug } from '@helper/getShowSlug';
import { EpisodeStillComponent } from '@shared/components/episode-still/episode-still.component';

@Component({
  selector: 't-episode',
  standalone: true,
  imports: [
    NgTemplateOutlet,
    NgOptimizedImage,
    RouterModule,
    DatePipe,
    DecimalPipe,
    MatProgressSpinnerModule,
    NgOptimizedImage,
    MatButtonModule,
    EpisodeStillComponent,
  ],
  templateUrl: './base-episode.component.html',
  styleUrl: './base-episode.component.scss',
})
export class BaseEpisodeComponent {
  episode = input.required<EpisodeFull | null | undefined>();
  show = input.required<Show | undefined>();
  isLoggedIn = input<boolean | null>();
  isNewShow = input<boolean>();
  episodeProgress = input<EpisodeProgress | null>();
  tmdbEpisode = input<TmdbEpisode | null>();
  isSeenLoading = input<boolean>();
  withLink = input(false, { transform: booleanAttribute });

  @Output() addEpisode = new EventEmitter<{ episode: EpisodeFull; show: Show }>();
  @Output() removeEpisode = new EventEmitter<{ episode: EpisodeFull; show: Show }>();

  back = (history.state as State).back;

  showSlug = computed(() => getShowSlug(this.show()));

  episodeLink = computed(() => {
    const show = this.showSlug();
    const season = this.episode()?.season;
    const episode = this.episode()?.number;
    if (show === undefined || season === undefined || episode === undefined) return;
    return Paths.episode({ show, season: season + '', episode: episode + '' });
  });

  isInFuture = computed(() => {
    const dateString = this.episode()?.first_aired;
    if (dateString === undefined) return false;
    if (dateString === null) return true;
    return new Date(dateString) > new Date();
  });
}

import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import type { EpisodeFull, EpisodeProgress, Show } from '@type/Trakt';
import type { TmdbEpisode } from '@type/Tmdb';
import * as Paths from '@shared/paths';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { getShowSlug } from '@helper/getShowSlug';
import { EpisodeStillComponent } from '@shared/components/episode-still/episode-still.component';

@Component({
  selector: 't-episode',
  imports: [
    RouterModule,
    DatePipe,
    DecimalPipe,
    MatProgressSpinnerModule,
    MatButtonModule,
    EpisodeStillComponent,
  ],
  templateUrl: './base-episode.component.html',
  styleUrl: './base-episode.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BaseEpisodeComponent {
  episode = input<EpisodeFull>();
  show = input<Show>();
  episodeProgress = input<EpisodeProgress>();
  tmdbEpisode = input<TmdbEpisode>();
  isLoggedIn = input(false, { transform: booleanAttribute });
  isNewShow = input(false, { transform: booleanAttribute });
  isSeenLoading = input(false, { transform: booleanAttribute });
  withLink = input(false, { transform: booleanAttribute });

  addEpisode = output<{ episode: EpisodeFull; show: Show }>();
  removeEpisode = output<{ episode: EpisodeFull; show: Show }>();

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

  back = history.state?.back;
}

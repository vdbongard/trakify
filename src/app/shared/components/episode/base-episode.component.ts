import {
  booleanAttribute,
  Component,
  computed,
  input,
  OnDestroy,
  output,
  signal,
} from '@angular/core';
import type { EpisodeFull, EpisodeProgress, Show } from '@type/Trakt';
import type { TmdbEpisode } from '@type/Tmdb';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { getShowSlug } from '@helper/getShowSlug';
import { EpisodeStillComponent } from '@shared/components/episode-still/episode-still.component';

@Component({
  selector: 't-episode',
  imports: [RouterModule, DatePipe, DecimalPipe, MatButtonModule, EpisodeStillComponent],
  templateUrl: './base-episode.component.html',
  styleUrl: './base-episode.component.scss',
})
export class BaseEpisodeComponent implements OnDestroy {
  episode = input<EpisodeFull>();
  show = input<Show>();
  episodeProgress = input<EpisodeProgress>();
  tmdbEpisode = input<TmdbEpisode>();
  isLoggedIn = input(false, { transform: booleanAttribute });
  isNewShow = input(false, { transform: booleanAttribute });
  isSeenLoading = input(false, { transform: booleanAttribute });
  seenFeedbackEpisodeId = input<number>();
  withLink = input(false, { transform: booleanAttribute });

  addEpisode = output<{ episode: EpisodeFull; show: Show }>();
  removeEpisode = output<{ episode: EpisodeFull; show: Show }>();

  private seenClickBurstTimer?: ReturnType<typeof setTimeout>;
  seenClickBurst = signal(false);
  seenAction = signal<'seen' | 'unseen' | undefined>(undefined);

  showSlug = computed(() => getShowSlug(this.show()));

  isSeenFeedback = computed(
    () =>
      this.seenFeedbackEpisodeId() !== undefined &&
      this.episode()?.ids.trakt === this.seenFeedbackEpisodeId(),
  );

  seenButtonLabel = computed(() => {
    const action = this.isSeenLoading() ? this.seenAction() : undefined;
    if (action) return action === 'seen' ? 'Mark as seen' : 'Mark as unseen';
    return this.episodeProgress()?.completed ? 'Mark as unseen' : 'Mark as seen';
  });

  episodeLink = computed(() => {
    const show = this.showSlug();
    const season = this.episode()?.season;
    const episode = this.episode()?.number;
    if (show === undefined || season === undefined || episode === undefined) return;
    return `/shows/s/${show}/season/${season}/episode/${episode}`;
  });

  isInFuture = computed(() => {
    const dateString = this.episode()?.first_aired;
    if (dateString === undefined) return false;
    if (dateString === null) return true;
    return new Date(dateString) > new Date();
  });

  onSeenButtonClick(): void {
    const episode = this.episode();
    const show = this.show();
    if (!episode || !show) return;

    if (this.episodeProgress()?.completed) {
      this.seenAction.set('unseen');
      this.removeEpisode.emit({ episode, show });
      return;
    }

    this.seenAction.set('seen');
    this.seenClickBurst.set(true);
    clearTimeout(this.seenClickBurstTimer);
    this.seenClickBurstTimer = setTimeout(() => this.seenClickBurst.set(false), 800);
    this.addEpisode.emit({ episode, show });
  }

  ngOnDestroy(): void {
    clearTimeout(this.seenClickBurstTimer);
  }

  back = history.state?.back;
}

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
import type { EpisodeInfo } from '@type/Episode';
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
  /** What the view linking here already knew about the Episode, handed to the still's link. */
  episodeInfo = input<EpisodeInfo>();

  addEpisode = output<{ episode: EpisodeFull; show: Show }>();
  removeEpisode = output<{ episode: EpisodeFull; show: Show }>();
  /** Emitted when the still is followed, before the navigation it starts. Lets the page name that
   *  artwork for the view transition the click begins. */
  stillClick = output<void>();

  private seenClickBurstTimer?: ReturnType<typeof setTimeout>;
  seenClickBurst = signal(false);
  seenAction = signal<'seen' | 'unseen' | undefined>(undefined);

  showSlug = computed(() => getShowSlug(this.show()));

  /** Name the still carries in a view transition, set by the page when the view that led here named
   *  its own copy of the artwork. Left unset by pages that are not part of a morph. */
  transitionName = input<string>();

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

  onStillClick(event: MouseEvent): void {
    // A modified or non-primary click opens the Episode elsewhere instead of following it here, so
    // no view transition is coming to name the still for.
    if (event.button !== 0 || event.ctrlKey || event.shiftKey || event.altKey || event.metaKey) {
      return;
    }
    this.stillClick.emit();
  }

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

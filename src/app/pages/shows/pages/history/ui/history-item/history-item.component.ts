import { Component, computed, ElementRef, input, linkedSignal, viewChild } from '@angular/core';
import { DecimalPipe, formatDate, NgOptimizedImage } from '@angular/common';
import { ImagePrefixW185, ImagePrefixW300, EPISODE_STILL_TRANSITION_NAME } from '@constants';
import { episodeTitle as toEpisodeTitle } from '@helper/episodeTitle';
import { TickerComponent } from '@shared/components/ticker/ticker.component';
import type { HistoryPlay } from '@type/Trakt';
import type { TmdbEpisode, TmdbShow } from '@type/Tmdb';

@Component({
  selector: 't-history-item',
  imports: [DecimalPipe, NgOptimizedImage, TickerComponent],
  templateUrl: './history-item.component.html',
  styleUrl: './history-item.component.scss',
})
export class HistoryItemComponent {
  play = input.required<HistoryPlay>();
  tmdbShow = input<TmdbShow>();
  tmdbEpisode = input<TmdbEpisode | null>();
  i = input<number>();

  protected readonly ImagePrefixW185 = ImagePrefixW185;
  protected readonly ImagePrefixW300 = ImagePrefixW300;

  /** A Play's index decides preloading once, at its first render. Freezing it keeps `priority`
   *  from flipping when the History refetches after a Play is added or removed, because
   *  NgOptimizedImage rejects a `priority` change after the image has been initialised. */
  initialIndex = linkedSignal<number | undefined, number | undefined>({
    source: () => this.i(),
    computation: (i, previous) => previous?.value ?? i,
  });

  thumbImage = viewChild<ElementRef<HTMLImageElement>>('thumbImage');

  /** The first screenful of artwork is worth preloading, as on the Show list rows. */
  isPriority = computed(() => (this.initialIndex() ?? Infinity) <= 4);

  showName = computed(() => this.tmdbShow()?.name || this.play().show.title);
  episodeTitle = computed(() =>
    toEpisodeTitle(this.play().episode, this.play().episode.number, this.tmdbEpisode()),
  );
  stillPath = computed(() => this.tmdbEpisode()?.still_path);
  posterPath = computed(() => this.tmdbShow()?.poster_path);
  watchedAt = computed(() => formatDate(this.play().watched_at, 'HH:mm', 'en-US'));

  /** Names the artwork for the navigation that is starting, so it morphs into the Episode still.
   *
   *  Applied on the click instead of on render: the History can list the same Episode twice (a
   *  rewatch), and a view transition is dropped when two elements in a view share a name. The
   *  History page clears the name of the row it named before, and names the row a navigation came
   *  back from. The poster fallback is a different image, so a row showing it stays unnamed. */
  prepareViewTransition(): void {
    if (!this.stillPath()) return;
    this.thumbImage()?.nativeElement.style.setProperty(
      'view-transition-name',
      EPISODE_STILL_TRANSITION_NAME,
    );
  }

  clearViewTransition(): void {
    this.thumbImage()?.nativeElement.style.removeProperty('view-transition-name');
  }
}

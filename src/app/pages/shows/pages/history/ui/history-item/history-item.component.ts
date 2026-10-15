import { Component, computed, input, OnChanges, signal } from '@angular/core';
import { DecimalPipe, formatDate, NgOptimizedImage } from '@angular/common';
import { ImagePrefixW185, ImagePrefixW300 } from '@constants';
import { episodeTitle as toEpisodeTitle } from '@helper/episodeTitle';
import { TickerComponent } from '@shared/components/ticker/ticker.component';
import { SimpleChangesTyped } from '@type/SimpleChanges';
import type { HistoryPlay } from '@type/Trakt';
import type { TmdbEpisode, TmdbShow } from '@type/Tmdb';

@Component({
  selector: 't-history-item',
  imports: [DecimalPipe, NgOptimizedImage, TickerComponent],
  templateUrl: './history-item.component.html',
  styleUrl: './history-item.component.scss',
})
export class HistoryItemComponent implements OnChanges {
  play = input.required<HistoryPlay>();
  tmdbShow = input<TmdbShow>();
  tmdbEpisode = input<TmdbEpisode | null>();
  i = input<number>();

  protected readonly ImagePrefixW185 = ImagePrefixW185;
  protected readonly ImagePrefixW300 = ImagePrefixW300;

  initialIndex = signal<number | undefined>(undefined);

  /** The first screenful of artwork is worth preloading, as on the Show list rows. */
  isPriority = computed(() => (this.initialIndex() ?? Infinity) <= 4);

  ngOnChanges(changes: SimpleChangesTyped<this>): void {
    // A Play's index decides preloading once, at its first render. Freezing it keeps `priority`
    // from flipping when the History refetches after a Play is added or removed, because
    // NgOptimizedImage rejects a `priority` change after the image has been initialised.
    if (changes.i?.firstChange && this.i() !== undefined && this.initialIndex() === undefined) {
      this.initialIndex.set(this.i());
    }
  }

  showName = computed(() => this.tmdbShow()?.name || this.play().show.title);
  episodeTitle = computed(() =>
    toEpisodeTitle(this.play().episode, this.play().episode.number, this.tmdbEpisode()),
  );
  stillPath = computed(() => this.tmdbEpisode()?.still_path);
  posterPath = computed(() => this.tmdbShow()?.poster_path);
  watchedAt = computed(() => formatDate(this.play().watched_at, 'HH:mm', 'en-US'));
}

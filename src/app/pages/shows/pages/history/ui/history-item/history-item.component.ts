import {
  Component,
  computed,
  ElementRef,
  input,
  OnChanges,
  signal,
  viewChild,
} from '@angular/core';
import { DecimalPipe, formatDate, NgOptimizedImage } from '@angular/common';
import { ImagePrefixW185, ImagePrefixW300 } from '@constants';
import { episodeTitle as toEpisodeTitle } from '@helper/episodeTitle';
import { getShowWithEpisodeId } from '@helper/IdGetters';
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

  thumbImage = viewChild<ElementRef<HTMLImageElement>>('thumbImage');

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

  /** Name of the still in a view transition, matching the still on the Episode page. The poster
   *  fallback is a different image, so a row showing it stays out of the transition. */
  private transitionName = computed(() =>
    this.stillPath() ? getShowWithEpisodeId(this.play().show, this.play().episode) : undefined,
  );

  /** Names the artwork for the navigation that is starting, so it morphs into the Episode still.
   *
   *  The name is applied on the click instead of on render because the History can list the same
   *  Episode twice (a rewatch), and a view transition is dropped when two elements in a view share
   *  a name. The History page clears the name of the row it named before. */
  prepareViewTransition(): void {
    const name = this.transitionName();
    if (name) this.thumbImage()?.nativeElement.style.setProperty('view-transition-name', name);
  }

  clearViewTransition(): void {
    this.thumbImage()?.nativeElement.style.removeProperty('view-transition-name');
  }
}

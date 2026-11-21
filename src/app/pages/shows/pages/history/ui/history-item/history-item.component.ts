import {
  Component,
  computed,
  ElementRef,
  inject,
  input,
  linkedSignal,
  viewChild,
} from '@angular/core';
import { DecimalPipe, formatDate, NgOptimizedImage } from '@angular/common';
import { ImagePrefixW300, EPISODE_STILL_TRANSITION_NAME } from '@constants';
import { episodeTitle as toEpisodeTitle } from '@helper/episodeTitle';
import { translated } from '@helper/translation';
import { TickerComponent } from '@shared/components/ticker/ticker.component';
import { TranslationService } from '../../../../data/translation.service';
import type { HistoryPlay } from '@type/Trakt';
import type { TmdbEpisode, TmdbShow } from '@type/Tmdb';

@Component({
  selector: 't-history-item',
  imports: [DecimalPipe, NgOptimizedImage, TickerComponent],
  templateUrl: './history-item.component.html',
  styleUrl: './history-item.component.scss',
})
export class HistoryItemComponent {
  translationService = inject(TranslationService);

  play = input.required<HistoryPlay>();
  tmdbShow = input<TmdbShow>();
  tmdbEpisode = input<TmdbEpisode | null>();
  i = input<number>();

  protected readonly ImagePrefixW300 = ImagePrefixW300;

  initialIndex = linkedSignal<number | undefined, number | undefined>({
    source: () => this.i(),
    computation: (i, previous) => previous?.value ?? i,
  });

  thumbImage = viewChild<ElementRef<HTMLImageElement>>('thumbImage');

  isPriority = computed(() => (this.initialIndex() ?? Infinity) <= 4);

  private translatedShow = computed(() =>
    translated(this.play().show, this.translationService.getShowTranslation(this.play().show)),
  );
  private translatedEpisode = computed(() => {
    const { show, episode } = this.play();
    return translated(
      episode,
      this.translationService.getEpisodeTranslation(show, episode.season, episode.number),
    );
  });

  showName = computed(() => this.tmdbShow()?.name || this.translatedShow().title);
  episodeTitle = computed(() =>
    toEpisodeTitle(this.translatedEpisode(), this.play().episode.number, this.tmdbEpisode()),
  );
  stillPath = computed(() => this.tmdbEpisode()?.still_path);
  watchedAt = computed(() => formatDate(this.play().watched_at, 'HH:mm', 'en-US'));

  prepareViewTransition(): void {
    this.thumbImage()?.nativeElement.style.setProperty(
      'view-transition-name',
      EPISODE_STILL_TRANSITION_NAME,
    );
  }

  clearViewTransition(): void {
    this.thumbImage()?.nativeElement.style.removeProperty('view-transition-name');
  }
}

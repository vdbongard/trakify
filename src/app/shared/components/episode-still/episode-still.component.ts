import {
  booleanAttribute,
  Component,
  computed,
  ElementRef,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ImagePrefixOriginal, ImagePrefixW300 } from '@constants';
import type { EpisodeInfo } from '@type/Episode';
import type { TmdbEpisode } from '@type/Tmdb';

const paintedStills = signal<ReadonlySet<string>>(new Set());

export function resetPaintedStills(): void {
  paintedStills.set(new Set());
}

@Component({
  selector: 't-episode-still',
  imports: [CommonModule, NgOptimizedImage, RouterLink],
  templateUrl: './episode-still.component.html',
  styleUrl: './episode-still.component.scss',
})
export class EpisodeStillComponent {
  tmdbEpisode = input<TmdbEpisode>();
  hasEpisode = input(false, { transform: booleanAttribute });
  withLink = input(false, { transform: booleanAttribute });
  episodeLink = input<string>();
  transitionName = input<string>();
  transitionTarget = input(false, { transform: booleanAttribute });
  episodeInfo = input<EpisodeInfo>();

  imageElement = viewChild<ElementRef<HTMLImageElement>>('imageElement');

  stillSrc = computed(() => {
    const stillPath = this.tmdbEpisode()?.still_path;
    return stillPath ? ImagePrefixOriginal + stillPath : undefined;
  });

  stillWidth = signal<number | undefined>(undefined);
  stillHeight = signal<number | undefined>(undefined);
  stillLoaded = computed(() => {
    const src = this.stillSrc();
    return src !== undefined && paintedStills().has(src);
  });

  back = history.state?.back;
  stateWithBack = computed<Record<string, unknown>>(() => ({
    back: this.back,
    episodeInfo: this.episodeInfo(),
  }));
  protected readonly ImagePrefixW300 = ImagePrefixW300;

  onStillImageLoad(): void {
    const src = this.stillSrc();
    if (src) paintedStills.update((painted) => new Set(painted).add(src));
    this.stillWidth.set(this.imageElement()?.nativeElement.naturalWidth);
    this.stillHeight.set(this.imageElement()?.nativeElement.naturalHeight);
  }
}

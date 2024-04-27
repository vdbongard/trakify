import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  input,
  type OnChanges,
  signal,
  type SimpleChanges,
  viewChild,
} from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ImagePrefixOriginal } from '@constants';
import type { TmdbEpisode } from '@type/Tmdb';

@Component({
  selector: 't-episode-still',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, RouterLink],
  templateUrl: './episode-still.component.html',
  styleUrl: './episode-still.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EpisodeStillComponent implements OnChanges {
  tmdbEpisode = input<TmdbEpisode>();
  withLink = input(false, { transform: booleanAttribute });
  episodeLink = input<string>();

  imageElement = viewChild<ElementRef<HTMLImageElement>>('imageElement');

  stillWidth = signal<number | undefined>(undefined);
  stillHeight = signal<number | undefined>(undefined);
  stillLoaded = signal(false);

  back = history.state.back;
  protected readonly ImagePrefixOriginal = ImagePrefixOriginal;

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes.tmdbEpisode?.currentValue?.still_path !==
      changes.tmdbEpisode?.previousValue?.still_path
    ) {
      this.stillLoaded.set(false);
    }
  }

  onStillImageLoad(): void {
    this.stillWidth.set(this.imageElement()?.nativeElement.naturalWidth);
    this.stillHeight.set(this.imageElement()?.nativeElement.naturalHeight);
  }
}

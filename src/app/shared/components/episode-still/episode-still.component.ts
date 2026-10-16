import {
  booleanAttribute,
  Component,
  ElementRef,
  input,
  OnChanges,
  signal,
  SimpleChanges,
  viewChild,
} from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ImagePrefixOriginal } from '@constants';
import type { TmdbEpisode } from '@type/Tmdb';

@Component({
  selector: 't-episode-still',
  imports: [CommonModule, NgOptimizedImage, RouterLink],
  templateUrl: './episode-still.component.html',
  styleUrl: './episode-still.component.scss',
})
export class EpisodeStillComponent implements OnChanges {
  tmdbEpisode = input<TmdbEpisode>();
  withLink = input(false, { transform: booleanAttribute });
  episodeLink = input<string>();
  /** Name of the still in a view transition, so it morphs between two views showing it.
   *
   *  Carried by the wrapper rather than the image: the Episode page always refetches the still, so
   *  the image only exists once that request lands — well after the browser captures the new view.
   *  A named still is also never held back by the load fade: it has to be on screen when the browser
   *  takes the snapshot, and it is swapped out for a fresh instance when that request lands. */
  transitionName = input<string>();

  imageElement = viewChild<ElementRef<HTMLImageElement>>('imageElement');

  stillWidth = signal<number | undefined>(undefined);
  stillHeight = signal<number | undefined>(undefined);
  stillLoaded = signal(false);

  back = history.state?.back;
  protected readonly ImagePrefixOriginal = ImagePrefixOriginal;

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['tmdbEpisode']?.currentValue?.still_path !==
      changes['tmdbEpisode']?.previousValue?.still_path
    ) {
      this.stillLoaded.set(false);
    }
  }

  onStillImageLoad(): void {
    this.stillWidth.set(this.imageElement()?.nativeElement.naturalWidth);
    this.stillHeight.set(this.imageElement()?.nativeElement.naturalHeight);
  }
}

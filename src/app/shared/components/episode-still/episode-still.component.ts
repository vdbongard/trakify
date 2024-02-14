import {
  booleanAttribute,
  Component,
  ElementRef,
  input,
  OnChanges,
  SimpleChanges,
  viewChild,
} from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ImagePrefixOriginal } from '@constants';
import type { TmdbEpisode } from '@type/Tmdb';
import { State } from '@type/State';

@Component({
  selector: 't-episode-still',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, RouterLink],
  templateUrl: './episode-still.component.html',
  styleUrl: './episode-still.component.scss',
})
export class EpisodeStillComponent implements OnChanges {
  tmdbEpisode = input<TmdbEpisode>();
  withLink = input(false, { transform: booleanAttribute });
  episodeLink = input<string>();

  imageElement = viewChild<ElementRef<HTMLImageElement>>('imageElement');

  back = (history.state as State).back;
  stillWidth?: number;
  stillHeight?: number;
  stillLoaded = false;

  protected readonly ImagePrefixOriginal = ImagePrefixOriginal;

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['tmdbEpisode']?.currentValue?.still_path !==
      changes['tmdbEpisode']?.previousValue?.still_path
    ) {
      this.stillLoaded = false;
    }
  }

  onStillImageLoad(): void {
    this.stillWidth = this.imageElement()?.nativeElement.naturalWidth;
    this.stillHeight = this.imageElement()?.nativeElement.naturalHeight;
  }
}

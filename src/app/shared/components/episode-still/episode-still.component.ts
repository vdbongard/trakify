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

/** The still files the app has already painted, by the URL it showed them from.
 *
 *  The Episode page is reused for every Episode, and the still it renders is replaced as soon as
 *  the next Episode's own request lands — so going back to an Episode it showed a moment ago
 *  mounts a fresh still with no memory of that artwork. Its file is still in the browser cache,
 *  though, and fading it in again flashes the artwork from nothing. */
const paintedStills = signal<ReadonlySet<string>>(new Set());

/** Clears that record so each test starts with a fresh browser. Not used by application code. */
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
  withLink = input(false, { transform: booleanAttribute });
  episodeLink = input<string>();
  /** Name of the still in a view transition, so it morphs between two views showing it.
   *
   *  Carried by the wrapper rather than the image: the Episode page always refetches the still, so
   *  the image only exists once that request lands — well after the browser captures the new view.
   *  A named still is also never held back by the load fade: it has to be on screen when the browser
   *  takes the snapshot, and it is swapped out for a fresh instance when that request lands. It
   *  stands the artwork the naming view showed in for its own until then. */
  transitionName = input<string>();
  /** Whether this still is the incoming side of a transition that is running now: the browser
   *  captures this view before the page's own artwork has loaded, so the copy the linking view
   *  showed stands in underneath and the load fade is skipped. A still that only keeps its name
   *  at rest, so a later navigation can morph it, fades in as usual. */
  transitionTarget = input(false, { transform: booleanAttribute });
  /** What the view linking here already knew about the Episode. Carried through to the Episode page
   *  as router state, so it can render its own copy of the artwork before its own request lands. */
  episodeInfo = input<EpisodeInfo>();

  imageElement = viewChild<ElementRef<HTMLImageElement>>('imageElement');

  /** The file shown for the Episode's still, and the one the load fade applies to. */
  stillSrc = computed(() => {
    const stillPath = this.tmdbEpisode()?.still_path;
    return stillPath ? ImagePrefixOriginal + stillPath : undefined;
  });

  stillWidth = signal<number | undefined>(undefined);
  stillHeight = signal<number | undefined>(undefined);
  /** Whether the artwork is on screen: a still that changed fades in on load, but one the app has
   *  already painted is back from the browser cache and is shown straight away. */
  stillLoaded = computed(() => {
    const src = this.stillSrc();
    return src !== undefined && paintedStills().has(src);
  });

  back = history.state?.back;
  /** The still's link state: the Episode the linking view knew, plus where to go back to. */
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

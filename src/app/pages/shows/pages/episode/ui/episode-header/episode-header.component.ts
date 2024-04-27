import { DatePipe } from '@angular/common';
import { Component, ElementRef, computed, input, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { clamp } from '@helper/clamp';
import { episodeTitle } from '@helper/episodeTitle';
import { onKeyArrow } from '@helper/onKeyArrow';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { SwipeDirective } from '@shared/directives/swipe.directive';
import * as Paths from '@shared/paths';
import type { BreadcrumbPart } from '@type/Breadcrumb';
import type { TmdbEpisode } from '@type/Tmdb';
import type { Episode, EpisodeFull, EpisodeProgress } from '@type/Trakt';

@Component({
  selector: 't-episode-header',
  standalone: true,
  imports: [
    BreadcrumbComponent,
    DatePipe,
    MatButtonModule,
    RouterLink,
    MatIconModule,
    SwipeDirective,
  ],
  templateUrl: './episode-header.component.html',
  styleUrl: './episode-header.component.scss',
})
export class EpisodeHeaderComponent {
  episodeNumber = input.required<string>();
  seasonNumber = input.required<string>();
  showSlug = input.required<string>();
  episode = input<EpisodeFull>();
  episodeProgress = input<EpisodeProgress>();
  tmdbEpisode = input<TmdbEpisode>();
  breadcrumbParts = input<BreadcrumbPart[]>([]);
  episodes = input<Episode[]>();

  previousButton = viewChild('previousButton', { read: ElementRef });
  nextButton = viewChild('nextButton', { read: ElementRef });

  back = history.state.back;

  episodeTitle = computed(() => {
    const episode = this.episode();
    const episodeNumber = Number.parseInt(this.episodeNumber());
    const tmdbEpisode = this.tmdbEpisode();
    return episodeTitle(episode, episodeNumber, tmdbEpisode);
  });

  previousEpisodeLink = computed(() =>
    getEpisodeLink(this.episodeNumber(), this.seasonNumber(), this.showSlug(), -1),
  );

  nextEpisodeLink = computed(() =>
    getEpisodeLink(
      this.episodeNumber(),
      this.seasonNumber(),
      this.showSlug(),
      1,
      this.episodes()?.length,
    ),
  );

  constructor() {
    onKeyArrow({
      arrowLeft: () => this.previous(),
      arrowRight: () => this.next(),
    });
  }

  previous(event?: Event): void {
    if (event && this.isLightboxOpen(event)) return;
    this.previousButton()?.nativeElement.click();
  }

  next(event?: Event): void {
    if (event && this.isLightboxOpen(event)) return;
    this.nextButton()?.nativeElement.click();
  }

  isLightboxOpen(event: Event): boolean {
    return (event.target as HTMLElement).closest('.pswp') !== null;
  }
}

export function getEpisodeLink(
  episode: string,
  season: string,
  show: string,
  counter: number,
  max?: number,
): string {
  const episodeNumber = Number.parseInt(episode);

  if (Number.isNaN(episodeNumber)) throw Error('Episode number not found (getEpisodeLink())');

  const episodeNumberWithCounter = episodeNumber + counter;

  const newEpisodeNumber = clamp(
    episodeNumberWithCounter,
    1,
    max ?? (Math.abs(episodeNumberWithCounter) || 1),
  );

  return Paths.episode({ show, season, episode: `${newEpisodeNumber}` });
}

import { Component, computed, ElementRef, input, viewChild } from '@angular/core';
import { BreadcrumbPart } from '@type/Breadcrumb';
import { Episode, EpisodeFull, EpisodeProgress } from '@type/Trakt';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { onKeyArrow } from '@helper/onKeyArrow';
import { SwipeDirective } from '@shared/directives/swipe.directive';
import { State } from '@type/State';
import { clamp } from '@helper/clamp';
import * as Paths from '@shared/paths';
import { episodeTitle } from '@helper/episodeTitle';
import { TmdbEpisode } from '@type/Tmdb';

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
  breadcrumbParts = input<BreadcrumbPart[]>();
  episodes = input<Episode[]>();

  previousButton = viewChild('previousButton', { read: ElementRef });
  nextButton = viewChild('nextButton', { read: ElementRef });

  back = (history.state as State).back;

  episodeTitle = computed(() => {
    const episode = this.episode();
    const episodeNumber = parseInt(this.episodeNumber());
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
    if (this.isLightboxOpen(event)) return;
    this.previousButton()?.nativeElement.click();
  }

  next(event?: Event): void {
    if (this.isLightboxOpen(event)) return;
    this.nextButton()?.nativeElement.click();
  }

  isLightboxOpen(event?: Event): boolean {
    return (event?.target as HTMLElement)?.closest('.pswp') !== null;
  }
}

export function getEpisodeLink(
  episode: string | undefined,
  season: string | undefined,
  show: string | undefined,
  counter: number,
  max?: number,
): string {
  if (!episode || !season || !show) return '';

  const episodeNumber = parseInt(episode);

  if (isNaN(episodeNumber)) throw Error('Episode number not found (getEpisodeLink())');

  const episodeNumberWithCounter = episodeNumber + counter;

  const newEpisodeNumber = clamp(
    episodeNumberWithCounter,
    1,
    max ?? (Math.abs(episodeNumberWithCounter) || 1),
  );

  return Paths.episode({ show, season, episode: newEpisodeNumber + '' });
}

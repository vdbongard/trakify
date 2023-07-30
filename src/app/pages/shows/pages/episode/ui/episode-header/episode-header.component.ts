import { Component, computed, ElementRef, Input, Signal, ViewChild } from '@angular/core';
import { BreadcrumbPart } from '@type/Breadcrumb';
import { Episode, EpisodeFull, EpisodeProgress } from '@type/Trakt';
import { TmdbEpisode } from '@type/Tmdb';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { EpisodeTitlePipe } from '../../../../utils/pipes/episode-title.pipe';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { onKeyArrow } from '@helper/onKeyArrow';
import { SwipeDirective } from '@shared/directives/swipe.directive';
import { State } from '@type/State';
import { clamp } from '@helper/clamp';
import * as Paths from '@shared/paths';

@Component({
  selector: 't-episode-header',
  templateUrl: './episode-header.component.html',
  styleUrls: ['./episode-header.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    BreadcrumbComponent,
    EpisodeTitlePipe,
    DatePipe,
    MatButtonModule,
    RouterLink,
    MatIconModule,
    SwipeDirective,
  ],
})
export class EpisodeHeaderComponent {
  @Input({ required: true }) episodeNumber!: Signal<string>;
  @Input({ required: true }) seasonNumber!: Signal<string>;
  @Input({ required: true }) showSlug!: Signal<string>;
  @Input() breadcrumbParts?: BreadcrumbPart[];
  @Input() episode?: EpisodeFull | null;
  @Input() tmdbEpisode?: TmdbEpisode | null;
  @Input() episodeProgress?: EpisodeProgress | null;
  @Input() episodes?: Episode[] | null;

  @ViewChild('previousButton', { read: ElementRef }) previousButton?: ElementRef<HTMLLinkElement>;
  @ViewChild('nextButton', { read: ElementRef }) nextButton?: ElementRef<HTMLLinkElement>;

  back = (history.state as State).back;

  previousEpisodeLink = computed(() =>
    getEpisodeLink(this.episodeNumber(), this.seasonNumber(), this.showSlug(), -1),
  );

  nextEpisodeLink = computed(() =>
    getEpisodeLink(
      this.episodeNumber(),
      this.seasonNumber(),
      this.showSlug(),
      1,
      this.episodes?.length,
    ),
  );

  constructor() {
    onKeyArrow({
      arrowLeft: () => void this.previous(),
      arrowRight: () => void this.next(),
    });
  }

  previous(): void {
    this.previousButton?.nativeElement.click();
  }

  next(): void {
    this.nextButton?.nativeElement.click();
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

  return Paths.episode({
    show: show,
    season: season,
    episode: newEpisodeNumber + '',
  });
}

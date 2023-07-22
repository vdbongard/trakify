import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { BreadcrumbPart } from '@type/Breadcrumb';
import { Episode, EpisodeFull, EpisodeProgress } from '@type/Trakt';
import { TmdbEpisode } from '@type/Tmdb';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { EpisodeTitlePipe } from '../../utils/pipes/episode-title.pipe';
import { CommonModule, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { EpisodeLinkWithCounterPipe } from '@shared/pipes/episode-link-with-counter.pipe';
import { MatIconModule } from '@angular/material/icon';
import { onKeyArrow } from '@helper/onKeyArrow';
import { SwipeDirective } from '@shared/directives/swipe.directive';
import { State } from '@type/State';

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
    EpisodeLinkWithCounterPipe,
    MatIconModule,
    SwipeDirective,
  ],
})
export class EpisodeHeaderComponent {
  @Input() breadcrumbParts?: BreadcrumbPart[];
  @Input() episode?: EpisodeFull | null;
  @Input() tmdbEpisode?: TmdbEpisode | null;
  @Input() episodeProgress?: EpisodeProgress | null;
  @Input() episodeNumber?: string;
  @Input() seasonNumber?: string;
  @Input() showSlug?: string;
  @Input() episodes?: Episode[] | null;

  @ViewChild('previousButton', { read: ElementRef }) previousButton?: ElementRef<HTMLLinkElement>;
  @ViewChild('nextButton', { read: ElementRef }) nextButton?: ElementRef<HTMLLinkElement>;

  back = (history.state as State).back;

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

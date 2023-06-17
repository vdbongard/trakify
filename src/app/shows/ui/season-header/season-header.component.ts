import { Component, ElementRef, Input, OnChanges, ViewChild } from '@angular/core';
import { BreadcrumbPart } from '@type/Breadcrumb';
import { EpisodeFull, Season, SeasonProgress } from '@type/Trakt';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { SeasonTitlePipe } from '../../utils/pipes/season-title.pipe';
import { SeasonLinkWithCounterPipe } from '@shared/pipes/season-link-with-counter.pipe';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { SimpleChangesTyped } from '@type/SimpleChanges';
import { getAiredEpisodesInSeason } from '@helper/episodes';
import { onKeyArrow } from '@helper/onKeyArrow';
import { SwipeDirective } from '@shared/directives/swipe.directive';

@Component({
  selector: 't-season-header',
  templateUrl: './season-header.component.html',
  styleUrls: ['./season-header.component.scss'],
  standalone: true,
  imports: [
    BreadcrumbComponent,
    MatButtonModule,
    RouterLink,
    SeasonTitlePipe,
    SeasonLinkWithCounterPipe,
    MatProgressBarModule,
    MatIconModule,
    SwipeDirective,
  ],
})
export class SeasonHeaderComponent implements OnChanges {
  @Input() breadcrumbParts?: BreadcrumbPart[];
  @Input() seasonNumber?: string | null;
  @Input() showSlug?: string | null;
  @Input() seasonProgress?: SeasonProgress | null;
  @Input() seasons?: Season[] | null;
  @Input() episodes?: EpisodeFull[] | null;

  @ViewChild('previousButton', { read: ElementRef }) previousButton?: ElementRef<HTMLLinkElement>;
  @ViewChild('nextButton', { read: ElementRef }) nextButton?: ElementRef<HTMLLinkElement>;

  back = history.state.back;

  episodesAired = 0;

  constructor() {
    onKeyArrow({
      arrowLeft: () => this.previous(),
      arrowRight: () => this.next(),
    });
  }

  ngOnChanges(changes: SimpleChangesTyped<this>): void {
    if (changes.seasonProgress || changes.episodes) {
      this.episodesAired = getAiredEpisodesInSeason(this.episodes, this.seasonProgress);
    }
  }

  previous(): void {
    this.previousButton?.nativeElement.click();
  }

  next(): void {
    this.nextButton?.nativeElement.click();
  }
}

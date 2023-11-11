import { Component, computed, ElementRef, Input, Signal, ViewChild } from '@angular/core';
import { BreadcrumbPart } from '@type/Breadcrumb';
import { EpisodeFull, Season, SeasonProgress } from '@type/Trakt';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { getAiredEpisodesInSeason } from '@helper/episodes';
import { onKeyArrow } from '@helper/onKeyArrow';
import { SwipeDirective } from '@shared/directives/swipe.directive';
import { State } from '@type/State';
import { clamp } from '@helper/clamp';
import * as Paths from '@shared/paths';
import { seasonTitle } from '@helper/seasonTitle';

@Component({
  selector: 't-season-header',
  standalone: true,
  imports: [
    BreadcrumbComponent,
    MatButtonModule,
    RouterLink,
    MatProgressBarModule,
    MatIconModule,
    SwipeDirective,
  ],
  templateUrl: './season-header.component.html',
  styleUrl: './season-header.component.scss',
})
export class SeasonHeaderComponent {
  @Input({ required: true }) seasonNumber!: Signal<string>;
  @Input({ required: true }) showSlug!: Signal<string>;
  @Input({ required: true }) seasons!: Signal<Season[] | null | undefined>;
  @Input({ required: true }) seasonProgress!: Signal<SeasonProgress | null | undefined>;
  @Input({ required: true }) episodes!: Signal<EpisodeFull[] | null | undefined>;
  @Input() breadcrumbParts?: BreadcrumbPart[];

  @ViewChild('previousButton', { read: ElementRef }) previousButton?: ElementRef<HTMLLinkElement>;
  @ViewChild('nextButton', { read: ElementRef }) nextButton?: ElementRef<HTMLLinkElement>;

  back = (history.state as State).back;

  seasonTitle = computed(() =>
    seasonTitle(this.seasonProgress()?.title ?? 'Season ' + this.seasonNumber()),
  );

  previousSeasonLink = computed(() => {
    if (!this.seasons()) return null;
    return getSeasonLink(this.showSlug(), this.seasonNumber(), -1, this.seasons()!);
  });

  nextSeasonLink = computed(() => {
    if (!this.seasons()) return null;
    return getSeasonLink(this.showSlug(), this.seasonNumber(), 1, this.seasons()!);
  });

  episodesAired = computed(() => getAiredEpisodesInSeason(this.episodes(), this.seasonProgress()));

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

export function getSeasonLink(
  show: string | null | undefined,
  season: string | null | undefined,
  counter: number,
  numbers: { number: number }[],
): string {
  if (!season || !show || !numbers[0]) return '';

  const seasonNumber = parseInt(season);

  if (isNaN(seasonNumber)) throw Error('Season number not found (EpisodeLinkWithCounterPipe)');

  const seasonNumberWithCounter = seasonNumber + counter;

  const newSeasonNumber = clamp(
    seasonNumberWithCounter,
    numbers.at(0)!.number,
    numbers.at(-1)!.number,
  );

  return Paths.season({ show, season: newSeasonNumber + '' });
}

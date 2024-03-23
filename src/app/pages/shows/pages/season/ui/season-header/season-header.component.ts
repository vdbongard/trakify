import { Component, computed, ElementRef, input, viewChild } from '@angular/core';
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
  seasonNumber = input<string>();
  showSlug = input<string>();
  seasons = input<Season[]>();
  seasonProgress = input<SeasonProgress>();
  episodes = input<EpisodeFull[]>();
  breadcrumbParts = input<BreadcrumbPart[]>();

  previousButton = viewChild('previousButton', { read: ElementRef });
  nextButton = viewChild('nextButton', { read: ElementRef });

  seasonTitle = computed(() =>
    seasonTitle(this.seasonProgress()?.title ?? 'Season ' + this.seasonNumber()),
  );

  previousSeasonLink = computed(() => {
    if (!this.seasons()) return null;
    if (!this.showSlug()) return null;
    if (!this.seasonNumber()) return null;
    return getSeasonLink(this.showSlug()!, this.seasonNumber()!, -1, this.seasons()!);
  });

  nextSeasonLink = computed(() => {
    if (!this.seasons()) return null;
    if (!this.showSlug()) return null;
    if (!this.seasonNumber()) return null;
    return getSeasonLink(this.showSlug()!, this.seasonNumber()!, 1, this.seasons()!);
  });

  episodesAired = computed(() => getAiredEpisodesInSeason(this.episodes(), this.seasonProgress()));

  back = history.state.back;

  constructor() {
    onKeyArrow({
      arrowLeft: () => void this.previous(),
      arrowRight: () => void this.next(),
    });
  }

  previous(): void {
    this.previousButton()?.nativeElement.click();
  }

  next(): void {
    this.nextButton()?.nativeElement.click();
  }
}

export function getSeasonLink(
  show: string,
  season: string,
  counter: number,
  numbers: { number: number }[],
): string {
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

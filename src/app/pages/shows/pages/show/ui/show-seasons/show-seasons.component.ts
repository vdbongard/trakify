import { Component, Input, Signal } from '@angular/core';
import { EpisodeFull, Show, ShowProgress } from '@type/Trakt';
import { TmdbShow } from '@type/Tmdb';
import * as Paths from '@shared/paths';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';
import { MatRippleModule } from '@angular/material/core';
import { HideRippleOnScrollDirective } from '@shared/directives/hide-ripple-on-scroll.directive';
import { RouterLink } from '@angular/router';
import { ShowSeasonItemComponent } from '../show-season-item/show-season-item.component';
import { ShowSlugPipe } from '@shared/pipes/show-slug.pipe';
import { NgGenericPipeModule } from 'ng-generic-pipe';

@Component({
  selector: 't-show-seasons',
  templateUrl: './show-seasons.component.html',
  styleUrls: ['./show-seasons.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatRippleModule,
    HideRippleOnScrollDirective,
    RouterLink,
    ShowSeasonItemComponent,
    ShowSlugPipe,
    NgGenericPipeModule,
  ],
})
export class ShowSeasonsComponent {
  @Input({ required: true }) showProgress!: Signal<ShowProgress | undefined>;
  @Input() show?: Show | null;
  @Input() seasonsEpisodes?: Record<string, EpisodeFull[] | undefined> | null;
  @Input() tmdbShow?: TmdbShow | null;
  @Input() back?: string;

  protected readonly Paths = Paths;
}

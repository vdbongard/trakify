import { Component, EventEmitter, Input, Output, Signal } from '@angular/core';
import { Episode, EpisodeFull, SeasonProgress, Show } from '@type/Trakt';
import * as Paths from '@shared/paths';
import { LoadingComponent } from '@shared/components/loading/loading.component';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';
import { MatRippleModule } from '@angular/material/core';
import { HideRippleOnScrollDirective } from '@shared/directives/hide-ripple-on-scroll.directive';
import { RouterLink } from '@angular/router';
import { ShowSlugPipe } from '@shared/pipes/show-slug.pipe';
import { NgGenericPipeModule } from 'ng-generic-pipe';
import { SeasonEpisodeItemComponent } from '../season-episode-item/season-episode-item.component';
import { State } from '@type/State';

@Component({
  selector: 't-season-episodes',
  templateUrl: './season-episodes.component.html',
  styleUrls: ['./season-episodes.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    LoadingComponent,
    MatListModule,
    MatRippleModule,
    HideRippleOnScrollDirective,
    RouterLink,
    ShowSlugPipe,
    NgGenericPipeModule,
    SeasonEpisodeItemComponent,
  ],
})
export class SeasonEpisodesComponent {
  @Input() isLoggedIn?: boolean | null;
  @Input() show?: Show | null;
  @Input() seasonNumber?: string | null;
  @Input({ required: true }) seasonProgress!: Signal<SeasonProgress | null | undefined>;
  @Input({ required: true }) episodes!: EpisodeFull[] | null;

  @Output() addEpisode = new EventEmitter<{ episode: Episode; show: Show }>();
  @Output() removeEpisode = new EventEmitter<{ episode: Episode; show: Show }>();

  paths = Paths;
  back = (history.state as State).back;
}

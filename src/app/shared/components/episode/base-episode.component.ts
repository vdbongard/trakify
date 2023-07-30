import { Component, computed, EventEmitter, Input, Output, Signal } from '@angular/core';
import type { EpisodeFull, EpisodeProgress, Show } from '@type/Trakt';
import type { TmdbEpisode } from '@type/Tmdb';
import { ImagePrefixOriginal } from '@constants';
import * as Paths from '@shared/paths';
import { CommonModule, DatePipe, DecimalPipe, NgOptimizedImage } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ShowSlugPipe } from '../../pipes/show-slug.pipe';
import { NgGenericPipeModule } from 'ng-generic-pipe';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { State } from '@type/State';

@Component({
  selector: 't-episode',
  templateUrl: './base-episode.component.html',
  styleUrls: ['./base-episode.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ShowSlugPipe,
    NgGenericPipeModule,
    DatePipe,
    DecimalPipe,
    MatProgressSpinnerModule,
    NgOptimizedImage,
    MatButtonModule,
  ],
})
export class BaseEpisodeComponent {
  @Input({ required: true }) episode!: Signal<EpisodeFull | null | undefined>;
  @Input() isLoggedIn?: boolean | null;
  @Input() show?: Show | null;
  @Input() isNewShow?: boolean;
  @Input() episodeProgress?: EpisodeProgress | null;
  @Input() tmdbEpisode?: TmdbEpisode | null;
  @Input() isSeenLoading?: boolean;
  @Input() withLink?: boolean;

  @Output() addEpisode = new EventEmitter<{ episode: EpisodeFull; show: Show }>();
  @Output() removeEpisode = new EventEmitter<{ episode: EpisodeFull; show: Show }>();
  @Output() showImage = new EventEmitter<{ url: string; name: string }>();

  stillLoaded = false;
  stillPrefix = ImagePrefixOriginal;
  paths = Paths;
  back = (history.state as State).back;

  isInFuture = computed(() => {
    const dateString = this.episode()?.first_aired;
    if (dateString === undefined) return false;
    if (dateString === null) return true;
    return new Date(dateString) > new Date();
  });

  showImageFunction(): void {
    if (this.withLink) return;

    this.showImage.emit({
      url: this.stillPrefix + this.tmdbEpisode?.still_path,
      name: 'Episode still',
    });
  }
}

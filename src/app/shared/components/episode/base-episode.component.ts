import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import type { EpisodeFull, EpisodeProgress, Show } from '@type/interfaces/Trakt';
import type { TmdbEpisode } from '@type/interfaces/Tmdb';
import { ImagePrefixOriginal } from '@constants';
import * as Paths from '@shared/paths';
import { DatePipe, DecimalPipe, NgIf, NgOptimizedImage } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ShowSlugPipe } from '../../pipes/show-slug.pipe';
import { NgGenericPipeModule } from 'ng-generic-pipe';
import { IsInFuturePipe } from '../../pipes/is-in-future.pipe';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 't-episode',
  templateUrl: './base-episode.component.html',
  styleUrls: ['./base-episode.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NgIf,
    RouterModule,
    ShowSlugPipe,
    NgGenericPipeModule,
    DatePipe,
    DecimalPipe,
    IsInFuturePipe,
    MatProgressSpinnerModule,
    NgOptimizedImage,
    MatButtonModule,
  ],
})
export class BaseEpisodeComponent {
  @Input() isLoggedIn?: boolean | null;
  @Input() show?: Show | null;
  @Input() episode?: EpisodeFull | null;
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
  back = history.state.back;

  showImageFunction(): void {
    if (this.withLink) return;

    this.showImage.emit({
      url: this.stillPrefix + this.tmdbEpisode?.still_path,
      name: 'Episode still',
    });
  }
}

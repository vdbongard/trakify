import {
  Component,
  computed,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  Signal,
  ViewChild,
} from '@angular/core';
import type { EpisodeFull, EpisodeProgress, Show } from '@type/Trakt';
import type { TmdbEpisode } from '@type/Tmdb';
import { ImagePrefixOriginal } from '@constants';
import * as Paths from '@shared/paths';
import { CommonModule, DatePipe, DecimalPipe, NgOptimizedImage } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { State } from '@type/State';
import { getShowSlug } from '@helper/getShowSlug';

@Component({
  selector: 't-episode',
  templateUrl: './base-episode.component.html',
  styleUrls: ['./base-episode.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    DatePipe,
    DecimalPipe,
    MatProgressSpinnerModule,
    NgOptimizedImage,
    MatButtonModule,
  ],
})
export class BaseEpisodeComponent {
  @Input({ required: true }) episode!: Signal<EpisodeFull | null | undefined>;
  @Input({ required: true }) show!: Signal<Show | undefined>;
  @Input() isLoggedIn?: boolean | null;
  @Input() isNewShow?: boolean;
  @Input() episodeProgress?: EpisodeProgress | null;
  @Input() tmdbEpisode?: TmdbEpisode | null;
  @Input() isSeenLoading?: boolean;
  @Input() withLink?: boolean;

  @Output() addEpisode = new EventEmitter<{ episode: EpisodeFull; show: Show }>();
  @Output() removeEpisode = new EventEmitter<{ episode: EpisodeFull; show: Show }>();

  @ViewChild('imageElement') imageElement?: ElementRef<HTMLImageElement>;

  back = (history.state as State).back;
  stillWidth?: number;
  stillHeight?: number;

  showSlug = computed(() => getShowSlug(this.show()));

  episodeLink = computed(() => {
    const show = this.showSlug();
    const season = this.episode()?.season;
    const episode = this.episode()?.number;
    if (show === undefined || season === undefined || episode === undefined) return;
    return Paths.episode({ show, season: season + '', episode: episode + '' });
  });

  isInFuture = computed(() => {
    const dateString = this.episode()?.first_aired;
    if (dateString === undefined) return false;
    if (dateString === null) return true;
    return new Date(dateString) > new Date();
  });

  protected readonly ImagePrefixOriginal = ImagePrefixOriginal;

  onStillImageLoad(): void {
    this.stillWidth = this.imageElement?.nativeElement.naturalWidth;
    this.stillHeight = this.imageElement?.nativeElement.naturalHeight;
  }
}

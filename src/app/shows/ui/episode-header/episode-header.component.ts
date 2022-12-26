import { Component, Input } from '@angular/core';
import { BreadcrumbPart } from '@type/Breadcrumb';
import { Episode, EpisodeFull, EpisodeProgress } from '@type/Trakt';
import { TmdbEpisode } from '@type/Tmdb';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { EpisodeTitlePipe } from '../../utils/pipes/episode-title.pipe';
import { DatePipe, NgIf } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { EpisodeLinkWithCounterPipe } from '@shared/pipes/episode-link-with-counter.pipe';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 't-episode-header',
  templateUrl: './episode-header.component.html',
  styleUrls: ['./episode-header.component.scss'],
  standalone: true,
  imports: [
    BreadcrumbComponent,
    EpisodeTitlePipe,
    DatePipe,
    NgIf,
    MatButtonModule,
    RouterLink,
    EpisodeLinkWithCounterPipe,
    MatIconModule,
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

  back = history.state.back;
}

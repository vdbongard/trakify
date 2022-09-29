import { Component, Input } from '@angular/core';
import { BreadcrumbPart } from '@type/interfaces/Breadcrumb';
import { Episode, EpisodeFull, EpisodeProgress } from '@type/interfaces/Trakt';
import { TmdbEpisode } from '@type/interfaces/Tmdb';

@Component({
  selector: 't-episode-header',
  templateUrl: './episode-header.component.html',
  styleUrls: ['./episode-header.component.scss'],
})
export class EpisodeHeaderComponent {
  @Input() breadcrumbParts?: BreadcrumbPart[];
  @Input() episode?: EpisodeFull | null;
  @Input() tmdbEpisode?: TmdbEpisode | null;
  @Input() episodeProgress?: EpisodeProgress;
  @Input() episodeNumber?: string;
  @Input() seasonNumber?: string;
  @Input() showSlug?: string;
  @Input() episodes?: Episode[];
}

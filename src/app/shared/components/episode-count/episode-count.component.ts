import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EpisodeFull, ShowProgress } from '@type/Trakt';
import { TmdbSeason } from '@type/Tmdb';
import { RemainingPipe } from '@shared/pipes/remaining.pipe';

@Component({
  selector: 't-episode-count',
  standalone: true,
  imports: [CommonModule, RemainingPipe],
  templateUrl: './episode-count.component.html',
  styleUrls: ['./episode-count.component.scss'],
})
export class EpisodeCountComponent {
  @Input() showProgress?: ShowProgress | null;
  @Input() nextEpisodeTrakt?: EpisodeFull | null;
  @Input() tmdbSeason?: TmdbSeason | null;
  @Input() episodes?: number;
  @Input() divider = '·';
  @Input() withDividerLeft = false;
  @Input() withDividerRight = false;
}

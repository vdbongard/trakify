import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { EpisodeFull, Show, ShowProgress } from '@type/interfaces/Trakt';
import { TmdbShow } from '@type/interfaces/Tmdb';
import * as Paths from '@shared/paths';

@Component({
  selector: 't-show-seasons',
  templateUrl: './show-seasons.component.html',
  styleUrls: ['./show-seasons.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowSeasonsComponent {
  @Input() show?: Show | null;
  @Input() showProgress?: ShowProgress | null;
  @Input() seasonsEpisodes?: { [seasonNumber: string]: EpisodeFull[] } | null;
  @Input() tmdbShow?: TmdbShow | null;
  @Input() back?: string;

  paths = Paths;
}

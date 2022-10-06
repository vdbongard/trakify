import { Component, Input } from '@angular/core';
import { EpisodeFull, Show, ShowProgress } from '@type/interfaces/Trakt';
import { TmdbShow } from '@type/interfaces/Tmdb';
import * as Paths from 'src/app/paths';

@Component({
  selector: 't-show-seasons',
  templateUrl: './show-seasons.component.html',
  styleUrls: ['./show-seasons.component.scss'],
})
export class ShowSeasonsComponent {
  @Input() show?: Show | null;
  @Input() showProgress?: ShowProgress | null;
  @Input() seasonsEpisodes?: EpisodeFull[][] | null;
  @Input() tmdbShow?: TmdbShow | null;

  paths = Paths;
}

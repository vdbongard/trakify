import { Component, Input } from '@angular/core';

import type { SeasonProgress } from '@type/interfaces/Trakt';
import type { TmdbShowSeason } from '@type/interfaces/Tmdb';

@Component({
  selector: 't-show-season-item',
  templateUrl: './show-season-item.component.html',
  styleUrls: ['./show-season-item.component.scss'],
})
export class ShowSeasonItemComponent {
  @Input() seasonProgress?: SeasonProgress;
  @Input() season?: TmdbShowSeason;
}

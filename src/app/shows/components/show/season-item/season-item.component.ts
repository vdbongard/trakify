import { Component, Input } from '@angular/core';

import type { SeasonProgress } from 'src/types/interfaces/Trakt';
import type { Season } from 'src/types/interfaces/Tmdb';

@Component({
  selector: 't-season-item',
  templateUrl: './season-item.component.html',
  styleUrls: ['./season-item.component.scss'],
})
export class SeasonItemComponent {
  @Input() seasonProgress?: SeasonProgress;
  @Input() season?: Season;
}

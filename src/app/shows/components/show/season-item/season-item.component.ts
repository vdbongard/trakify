import { Component, Input } from '@angular/core';
import { SeasonProgress } from '../../../../../types/interfaces/Trakt';
import { Season } from '../../../../../types/interfaces/Tmdb';

@Component({
  selector: 't-season-item',
  templateUrl: './season-item.component.html',
  styleUrls: ['./season-item.component.scss'],
})
export class SeasonItemComponent {
  @Input() seasonProgress?: SeasonProgress;
  @Input() season?: Season;
}

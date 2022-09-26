import { Component, Input } from '@angular/core';
import { ShowProgress } from '@type/interfaces/Trakt';
import { TmdbShow } from '@type/interfaces/Tmdb';

@Component({
  selector: 't-show-seasons',
  templateUrl: './show-seasons.component.html',
  styleUrls: ['./show-seasons.component.scss'],
})
export class ShowSeasonsComponent {
  @Input() showProgress?: ShowProgress | null;
  @Input() tmdbShow?: TmdbShow | null;
}

import { Component, Input } from '@angular/core';
import { Show } from '@type/Trakt';
import { MatButtonModule } from '@angular/material/button';
import { TmdbShow } from '@type/Tmdb';

@Component({
  selector: 't-show-links',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './show-links.component.html',
  styleUrls: ['./show-links.component.scss'],
})
export class ShowLinksComponent {
  @Input() show?: Show | null;
  @Input() tmdbShow?: TmdbShow | null;
}

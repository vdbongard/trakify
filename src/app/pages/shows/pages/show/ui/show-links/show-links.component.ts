import { Component, input } from '@angular/core';
import type { Show } from '@type/Trakt';
import { MatButtonModule } from '@angular/material/button';
import type { TmdbShow } from '@type/Tmdb';

@Component({
  selector: 't-show-links',
  standalone: true,
  imports: [MatButtonModule],
  templateUrl: './show-links.component.html',
  styleUrl: './show-links.component.scss',
})
export class ShowLinksComponent {
  show = input<Show>();
  tmdbShow = input<TmdbShow>();
}

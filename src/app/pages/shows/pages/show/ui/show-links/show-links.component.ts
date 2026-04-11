import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { Show } from '@type/Trakt';
import { TmdbShow } from '@type/Tmdb';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 't-show-links',
  imports: [MatButtonModule],
  templateUrl: './show-links.component.html',
  styleUrl: './show-links.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowLinksComponent {
  show = input<Show>();
  tmdbShow = input<TmdbShow>();
}

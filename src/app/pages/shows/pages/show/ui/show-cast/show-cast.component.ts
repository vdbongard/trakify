import { Component, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { Cast } from '@type/Tmdb';
import { ImagePrefixW185 } from '@constants';
import { TickerComponent } from '@shared/components/ticker/ticker.component';

@Component({
  selector: 't-show-cast',
  standalone: true,
  imports: [NgOptimizedImage, TickerComponent],
  templateUrl: './show-cast.component.html',
  styleUrl: './show-cast.component.scss',
})
export class ShowCastComponent {
  cast = input<Cast[]>();

  posterPrefix = ImagePrefixW185;

  encodeAsUrl(name: string): string {
    return encodeURIComponent(name);
  }
}

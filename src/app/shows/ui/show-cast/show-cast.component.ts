import { Component, Input } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Cast } from '@type/Tmdb';
import { ImagePrefixW185 } from '@constants';
import { TickerComponent } from '@shared/components/ticker/ticker.component';

@Component({
  selector: 't-show-cast',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, TickerComponent],
  templateUrl: './show-cast.component.html',
  styleUrls: ['./show-cast.component.scss'],
})
export class ShowCastComponent {
  @Input() cast?: Cast[] | null;

  posterPrefix = ImagePrefixW185;
}

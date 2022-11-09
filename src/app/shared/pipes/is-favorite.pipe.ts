import { Pipe, PipeTransform } from '@angular/core';

import { ShowService } from '../../shows/data/show.service';

import type { Show } from '@type/interfaces/Trakt';

@Pipe({
  name: 'isFavorite',
  standalone: true,
})
export class IsFavoritePipe implements PipeTransform {
  constructor(private showService: ShowService) {}

  transform(show?: Show): boolean {
    return this.showService.isFavorite(show);
  }
}

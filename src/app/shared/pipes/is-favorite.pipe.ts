import { Pipe, PipeTransform } from '@angular/core';

import { ShowService } from '../services/trakt/show.service';

import type { Show } from '../../../types/interfaces/Trakt';

@Pipe({
  name: 'isFavorite',
})
export class IsFavoritePipe implements PipeTransform {
  constructor(private showService: ShowService) {}

  transform(show?: Show): boolean {
    return this.showService.isFavorite(show);
  }
}

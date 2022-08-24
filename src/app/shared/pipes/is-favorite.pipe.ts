import { Pipe, PipeTransform } from '@angular/core';
import { Show } from '../../../types/interfaces/Trakt';
import { ShowService } from '../services/trakt/show.service';

@Pipe({
  name: 'isFavorite',
})
export class IsFavoritePipe implements PipeTransform {
  constructor(private showService: ShowService) {}

  transform(show?: Show): boolean {
    return this.showService.isFavorite(show);
  }
}

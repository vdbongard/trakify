import { Pipe, PipeTransform } from '@angular/core';
import { ShowService } from '@services/trakt/show.service';
import { Show } from '@type/interfaces/Trakt';

@Pipe({
  name: 'isHidden',
  standalone: true,
})
export class IsHiddenPipe implements PipeTransform {
  constructor(private showService: ShowService) {}

  transform(show: Show): boolean {
    return this.showService.isHidden(show);
  }
}

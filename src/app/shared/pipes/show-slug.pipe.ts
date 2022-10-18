import { Pipe, PipeTransform } from '@angular/core';
import { Show } from '@type/interfaces/Trakt';

@Pipe({
  name: 'showSlug',
})
export class ShowSlugPipe implements PipeTransform {
  transform(show?: Show | null): string {
    if (!show) return '';
    if (isNaN(show.ids.slug as unknown as number)) return show.ids.slug;
    return show.ids.trakt + '';
  }
}
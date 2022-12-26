import { Pipe, PipeTransform } from '@angular/core';
import { Genre } from '@type/Tmdb';

@Pipe({
  name: 'genre',
  standalone: true,
})
export class GenrePipe implements PipeTransform {
  transform(genres: Genre[]): string {
    return genres.map((genre) => genre.name).join(', ');
  }
}

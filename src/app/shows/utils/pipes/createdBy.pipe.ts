import { Pipe, PipeTransform } from '@angular/core';
import { CreatedBy } from '@type/Tmdb';

@Pipe({
  name: 'createdBy',
  standalone: true,
})
export class CreatedByPipe implements PipeTransform {
  transform(createdBy: CreatedBy[]): string {
    return createdBy.map((creator) => creator.name).join(', ');
  }
}

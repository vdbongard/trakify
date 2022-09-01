import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter',
})
export class FilterPipe implements PipeTransform {
  transform(array: unknown[], predicate: (value: unknown) => boolean): unknown[] {
    return array.filter(predicate);
  }
}

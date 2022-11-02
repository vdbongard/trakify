import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'slice',
  standalone: true,
})
export class SlicePipe implements PipeTransform {
  transform(string: string, start?: number, end?: number): string {
    return string.slice(start, end);
  }
}

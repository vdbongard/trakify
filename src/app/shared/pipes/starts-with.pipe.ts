import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'startsWith',
})
export class StartsWithPipe implements PipeTransform {
  transform(string: string, parameter: string): boolean {
    return string.startsWith(parameter);
  }
}

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'includes',
})
export class IncludesPipe implements PipeTransform {
  transform(stringOrArray: string | unknown[], parameter: string | number): boolean {
    return stringOrArray.includes(parameter as string);
  }
}

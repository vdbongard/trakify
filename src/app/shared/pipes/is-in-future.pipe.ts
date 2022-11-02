import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'isInFuture',
  standalone: true,
})
export class IsInFuturePipe implements PipeTransform {
  transform(dateString: string | null | undefined): boolean {
    if (dateString === undefined) return false;
    if (dateString === null) return true;
    return new Date(dateString) > new Date();
  }
}

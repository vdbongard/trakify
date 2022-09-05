import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'isInFuture',
})
export class IsInFuturePipe implements PipeTransform {
  transform(dateString: string | null | undefined): boolean {
    if (!dateString) return false;
    return new Date(dateString) > new Date();
  }
}

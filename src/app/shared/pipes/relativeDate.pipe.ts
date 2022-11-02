import { Pipe, PipeTransform } from '@angular/core';
import { formatDate } from '@angular/common';
import { addWeeks, formatDistanceToNowStrict, isWithinInterval } from 'date-fns';
import { capitalize } from '@helper/capitalize';

@Pipe({
  name: 'relativeDate',
  standalone: true,
})
export class RelativeDatePipe implements PipeTransform {
  transform(dateString: string | undefined, format: string): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    const lessThanAWeek = isWithinInterval(date, {
      start: new Date(),
      end: addWeeks(new Date(), 1),
    });

    if (lessThanAWeek) {
      const weekday = formatDate(dateString, ' (E.)', 'en-US');
      const relativeDistance = formatDistanceToNowStrict(date, {
        roundingMethod: 'ceil',
        addSuffix: true,
      });
      return capitalize(relativeDistance) + weekday;
    }

    return formatDate(dateString, format, 'en-US');
  }
}

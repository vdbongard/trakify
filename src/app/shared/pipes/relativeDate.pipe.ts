import { Pipe, PipeTransform } from '@angular/core';
import { formatDate } from '@angular/common';

@Pipe({
  name: 'relativeDate',
})
export class RelativeDatePipe implements PipeTransform {
  transform(dateString: string | undefined, format: string): string {
    if (!dateString) return '';
    const currentDateMs = new Date().getTime();
    const dateMs = new Date(dateString).getTime();

    const dayMs = 1000 * 60 * 60 * 24;
    const lessThanADay = dateMs <= currentDateMs + dayMs;

    if (lessThanADay) {
      const hours = formatDate(dateMs - currentDateMs, 'H', 'en-US');
      const hourString = hours === '1' ? 'hour' : 'hours';
      return `In ${hours} ${hourString}`;
    }

    const weekMs = dayMs * 7;
    const lessThanAWeek = dateMs <= currentDateMs + weekMs;

    if (lessThanAWeek) {
      const days = formatDate(dateMs - currentDateMs, 'd', 'en-US');
      const dayString = days === '1' ? 'day' : 'days';
      return `In ${days} ${dayString}`;
    }

    return formatDate(dateString, format, 'en-US');
  }
}

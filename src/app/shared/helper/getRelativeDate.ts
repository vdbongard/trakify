import { addWeeks, formatDistanceToNowStrict, isWithinInterval } from 'date-fns';
import { formatDate } from '@angular/common';
import { capitalize } from '@helper/capitalize';

export function getRelativeDate(dateString: string | null | undefined, format: string): string {
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

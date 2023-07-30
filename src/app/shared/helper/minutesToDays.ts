export function minutesToDays(minutesInput: number): string {
  const days = Math.trunc(minutesInput / 60 / 24);
  const hours = Math.trunc((minutesInput / 60) % 24);
  const minutes = Math.trunc(minutesInput % 60);
  const dayString = days === 1 ? 'day' : 'days';
  const hourString = hours === 1 ? 'hour' : 'hours';
  const minuteString = minutes === 1 ? 'minute' : 'minutes';

  return `${days} ${dayString} ${hours} ${hourString} ${minutes} ${minuteString}`;
}

import { HttpErrorResponse } from '@angular/common/http';
import { ObservableInput, timer } from 'rxjs';

export function errorDelay(error: HttpErrorResponse): ObservableInput<0> {
  if (error.status === 429) {
    const retryAfterHeader = error.headers.get('Retry-After');
    if (retryAfterHeader) {
      const ms = parseInt(retryAfterHeader) * 1000;
      return timer(ms);
    }
  }
  return timer(2000);
}

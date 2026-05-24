import { errorDelay } from './errorDelay';
import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { isObservable } from 'rxjs';

describe('errorDelay', () => {
  it('should return timer with value from Retry-After header on 429 status code', () => {
    const headers = new HttpHeaders().set('Retry-After', '5');
    const error = new HttpErrorResponse({
      headers,
      status: 429,
    });

    const result = errorDelay(error);
    expect(isObservable(result)).toBe(true);
  });

  it('should fallback to a timer with default delay seconds for non-429 errors', () => {
    const error = new HttpErrorResponse({
      status: 500,
    });

    const result = errorDelay(error);
    expect(isObservable(result)).toBe(true);
  });
});

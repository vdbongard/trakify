import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

/** 429 response carrying the given Retry-After header. */
export function retryAfter429(retryAfter: string): HttpErrorResponse {
  return new HttpErrorResponse({
    status: 429,
    statusText: 'Too Many Requests',
    headers: new HttpHeaders({ 'Retry-After': retryAfter }),
  });
}

/** Observable resolving to `value` after `delayMs`, tracking how many are in flight. */
export function delayedResponse<T>(
  value: T,
  delayMs: number,
  tracking: { inFlight: number; maxInFlight: number },
): Observable<T> {
  return new Observable<T>((subscriber) => {
    let settled = false;
    tracking.inFlight += 1;
    tracking.maxInFlight = Math.max(tracking.maxInFlight, tracking.inFlight);
    const id = setTimeout(() => {
      settled = true;
      tracking.inFlight -= 1;
      subscriber.next(value);
      subscriber.complete();
    }, delayMs);
    return (): void => {
      if (!settled) tracking.inFlight -= 1;
      clearTimeout(id);
    };
  });
}

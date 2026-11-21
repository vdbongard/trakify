import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export function retryAfter429(retryAfter: string): HttpErrorResponse {
  return new HttpErrorResponse({
    status: 429,
    statusText: 'Too Many Requests',
    headers: new HttpHeaders({ 'Retry-After': retryAfter }),
  });
}

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

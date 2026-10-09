import { lastValueFrom, Observable } from 'rxjs';
import { ZodSchema } from 'zod';
import { parseResponse } from '@operator/parseResponse';

/**
 * Validates a single-shot HTTP response with Zod and exposes it behind a Promise
 * seam, so TanStack Query functions and other callers await instead of converting
 * the Observable themselves.
 */
export function fetchParsed<T>(request: Observable<T>, schema?: ZodSchema): Promise<T> {
  return lastValueFrom(request.pipe(parseResponse(schema)));
}

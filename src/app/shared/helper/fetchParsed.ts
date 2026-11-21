import { lastValueFrom, Observable } from 'rxjs';
import { ZodSchema } from 'zod';
import { parseResponse } from '@operator/parseResponse';

export function fetchParsed<T>(request: Observable<T>, schema?: ZodSchema): Promise<T> {
  return lastValueFrom(request.pipe(parseResponse(schema)));
}

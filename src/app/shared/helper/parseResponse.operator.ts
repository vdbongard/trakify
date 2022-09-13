import { MonoTypeOperatorFunction, tap } from 'rxjs';
import { ZodSchema } from 'zod';
import { environment } from '../../../environments/environment';

export function parseResponse<T>(schema?: ZodSchema): MonoTypeOperatorFunction<T> {
  return tap({
    next: (value: T) => {
      if (!schema) return;
      if (!environment.production) {
        schema.parse(value);
      } else {
        const parsed = schema.safeParse(value);
        if (!parsed.success) console.error(parsed.error);
      }
    },
  });
}

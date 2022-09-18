import { MonoTypeOperatorFunction, tap } from 'rxjs';
import { ZodError, ZodSchema, ZodArray } from 'zod';
import { environment } from '../environments/environment';

export function parseResponse<T>(schema?: ZodSchema): MonoTypeOperatorFunction<T> {
  return tap({
    next: (value: T) => {
      if (!schema) return;

      if (!environment.production) {
        try {
          schema.parse(value);
        } catch (error) {
          if (error instanceof ZodError) {
            console.error(
              'ZodErrors',
              error.errors,
              '\nSchema shape',
              // @ts-ignore
              schema instanceof ZodArray ? schema.element.shape : schema.shape
            );
            return;
          }
          throw error;
        }
      } else {
        const parsed = schema.safeParse(value);
        if (!parsed.success) console.error(parsed.error);
      }
    },
  });
}

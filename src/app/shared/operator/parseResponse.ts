import { type MonoTypeOperatorFunction, tap } from 'rxjs';
import { ZodArray, ZodError, type ZodSchema } from 'zod';
import { isDevMode } from '@angular/core';

export function parseResponse<T>(schema?: ZodSchema): MonoTypeOperatorFunction<T> {
  return tap({
    next: (value: T) => {
      if (!schema) return;

      if (isDevMode()) {
        try {
          schema.parse(value);
        } catch (error) {
          if (error instanceof ZodError) {
            console.error(
              'ZodErrors',
              error.errors,
              '\nSchema shape',
              // @ts-ignore
              schema instanceof ZodArray ? schema.element.shape : schema.shape,
              '\nValue',
              value,
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

import { Injectable, type WritableSignal, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import type { Params } from '@angular/router';
import { catchErrorAndReplay } from '@operator/catchErrorAndReplay';
import type { LoadingState } from '@type/Enum';
import { type Observable, distinctUntilChanged, map } from 'rxjs';
import type { ZodSchema } from 'zod';

@Injectable({
  providedIn: 'root',
})
export class ParamService {
  snackBar = inject(MatSnackBar);

  params$<T>(
    params: Observable<Params>,
    paramSchema: ZodSchema<T>,
    pageStates: WritableSignal<LoadingState>[],
  ): Observable<T> {
    return params.pipe(
      map((params) => paramSchema.parse(params)),
      distinctUntilChanged(),
      catchErrorAndReplay('params', this.snackBar, pageStates),
    );
  }
}

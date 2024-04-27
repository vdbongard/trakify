import { inject, Injectable, type WritableSignal } from '@angular/core';
import { distinctUntilChanged, map, type Observable } from 'rxjs';
import { catchErrorAndReplay } from '@operator/catchErrorAndReplay';
import type { ZodSchema } from 'zod';
import type { LoadingState } from '@type/Enum';
import { MatSnackBar } from '@angular/material/snack-bar';
import type { Params } from '@angular/router';

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

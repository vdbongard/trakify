import { inject, Injectable, WritableSignal } from '@angular/core';
import { distinctUntilChanged, map, Observable } from 'rxjs';
import { catchErrorAndReplay } from '@operator/catchErrorAndReplay';
import { ZodSchema } from 'zod';
import { LoadingState } from '@type/Loading';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Params } from '@angular/router';

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

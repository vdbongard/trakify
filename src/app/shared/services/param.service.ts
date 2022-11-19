import { Injectable } from '@angular/core';
import { BehaviorSubject, distinctUntilChanged, map, Observable } from 'rxjs';
import { catchErrorAndReplay } from '@operator/catchErrorAndReplay';
import { ZodSchema } from 'zod';
import { LoadingState } from '@type/enum';
import { MatLegacySnackBar as MatSnackBar } from '@angular/material/legacy-snack-bar';
import { Params } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class ParamService {
  constructor(private snackBar: MatSnackBar) {}

  params$<T>(
    params: Observable<Params>,
    paramSchema: ZodSchema<T>,
    pageState: BehaviorSubject<LoadingState>
  ): Observable<T> {
    return params.pipe(
      map((params) => paramSchema.parse(params)),
      distinctUntilChanged(),
      catchErrorAndReplay('params', this.snackBar, pageState)
    );
  }
}

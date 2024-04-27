import { catchError, type MonoTypeOperatorFunction, type Observable, shareReplay, tap } from 'rxjs';
import { onError$ } from '@helper/error';
import type { MatSnackBar } from '@angular/material/snack-bar';
import type { LoadingState } from '@type/Enum';
import type { WritableSignal } from '@angular/core';

export function catchErrorAndReplay<T>(
  name: string,
  snackBar: MatSnackBar,
  pageStates: WritableSignal<LoadingState>[],
  errorMessage?: string,
): MonoTypeOperatorFunction<T> {
  return <T>(source: Observable<T>) =>
    source.pipe(
      catchError((error) => onError$(error, snackBar, pageStates, errorMessage, name)),
      tap((value) => value !== undefined && console.debug(name, value)),
      shareReplay(),
    );
}

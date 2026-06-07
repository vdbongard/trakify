import { MatSnackBar } from '@angular/material/snack-bar';
import { EMPTY, Observable } from 'rxjs';
import { LoadingState } from '@type/Loading';
import { HttpErrorResponse } from '@angular/common/http';
import { WritableSignal } from '@angular/core';

export function getErrorMessage(error: unknown, fallback = 'Unknown error'): string {
  if (error instanceof HttpErrorResponse) return error.message;
  if (error instanceof Error) return error.message;
  return fallback;
}

export function onError(
  error?: unknown,
  snackBar?: MatSnackBar,
  loadingStates?: WritableSignal<LoadingState>[],
  errorMessage?: string,
  name?: string,
): void {
  console.error(name, error ?? errorMessage);
  loadingStates?.forEach((loadingState) => loadingState.set('error'));

  const message = getErrorMessage(
    error,
    errorMessage ?? `Unknown error (${JSON.stringify(error)})`,
  );

  snackBar
    ?.open(message, 'Reload', { duration: 6000 })
    .onAction()
    .subscribe(() => window.location.reload());
}

export function onError$(
  error?: unknown,
  snackBar?: MatSnackBar,
  loadingStates?: WritableSignal<LoadingState>[],
  errorMessage?: string,
  name?: string,
): Observable<never> {
  onError(error, snackBar, loadingStates, errorMessage, name);
  return EMPTY;
}

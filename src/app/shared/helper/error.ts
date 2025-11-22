import { MatSnackBar } from '@angular/material/snack-bar';
import { EMPTY, Observable } from 'rxjs';
import { LoadingState } from '@type/Loading';
import { HttpErrorResponse } from '@angular/common/http';
import { WritableSignal } from '@angular/core';

export function onError(
  error?: unknown,
  snackBar?: MatSnackBar,
  loadingStates?: WritableSignal<LoadingState>[],
  errorMessage?: string,
  name?: string,
): void {
  console.error(name, error ?? errorMessage);
  loadingStates?.forEach((loadingState) => loadingState.set('error'));

  let message = errorMessage;
  if (!message && error instanceof Error) message = error.message;
  if (!message && error instanceof HttpErrorResponse) message = error.message;
  if (!message) message = message = `Unknown error (${JSON.stringify(error)})`;

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
